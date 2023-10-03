import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/NewMessage.js";
import input from "input";

import { config } from "../config.js";
import _ from "lodash";

const FLUSH_TIMEOUT = 5000;

export class TelegramApi {
  constructor() {
    this.client = new TelegramClient(
      new StringSession(config.telegramSession),
      Number(config.telegramApiId),
      config.telegramApiHash,
      { connectionRetries: 5 },
    );
    this.grouped = [];
    this.listeningChannels = [];
    this.eventPrint = this.eventPrint.bind(this);
    this.publishNewsToDestinationChannel =
      this.publishNewsToDestinationChannel.bind(this);
    this.flushGrouped = _.debounce(
      this.flushGroupedImpl.bind(this),
      FLUSH_TIMEOUT,
    );
  }

  async start(destinationChannel) {
    await this.client.start({
      phoneNumber: async () => await input.text("phone number ?"),
      password: async () => await input.text("password ?"),
      phoneCode: async () => await input.text("code ?"),
      onError: (err) => console.log("ERR: ", err),
    });
    this.destinationChannel = destinationChannel;
  }

  async startAsBot(destinationChannel) {
    await this.client.start({
      botAuthToken: config.telegramBotToken,
    });
    this.destinationChannel = destinationChannel;
  }

  async stop() {
    await this.client.disconnect();
  }

  sendMessage(userId, message) {
    return this.client.sendMessage(userId, { message });
  }

  resolveUsername(username) {
    return this.client.invoke(
      new Api.contacts.ResolveUsername({
        username,
      }),
    );
  }

  getMessagesHistory(username, { limit = 1 }) {
    return this.client.invoke(
      new Api.messages.GetHistory({
        peer: username,
        limit,
      }),
    );
  }

  async getHistory(entity, { limit = 10, offset = 0 } = {}) {
    return this.client.invoke(
      new Api.messages.GetHistory({
        peer: entity,
        limit,
        offsetId: 0,
        offsetDate: 0,
        addOffset: offset,
        maxId: 0,
        minId: 0,
        hash: 0,
        justImportant: false,
        selectUnread: false,
      }),
    );
  }

  async getEntity(entity) {
    return this.client.getEntity(entity);
  }

  async checkIfChannel(entity) {
    return this.getEntity(entity)
      .then(({ className }) => className === "Channel")
      .catch(() => false);
  }

  groupMessages(from, messages) {
    const result = [];

    for (let i = 0; i < messages.length; i++) {
      const { id, groupedId } = messages[i];
      if (!groupedId) {
        result.push({ from, ids: [id] });
      } else {
        // Собирем все сгруппированные собщения в одно;
        const messageIds = [];

        while (
          i < messages.length &&
          messages[i].groupedId &&
          BigInt(messages[i].groupedId) === BigInt(groupedId)
        ) {
          messageIds.push(messages[i].id);
          i++;
        }

        result.push({ from, ids: messageIds });
      }
    }

    return result;
  }

  async flushGroupedImpl() {
    const groupedByUsername = this.grouped.reduce((acc, curr) => {
      const username = this.listeningChannels.find(
        (listening) => BigInt(listening.id) === BigInt(curr.channelId),
      )?.username;

      if (!username) {
        return acc;
      }

      const current = acc[username] ?? [];
      current.push(curr.message);

      acc[username] = current;

      return acc;
    }, {});

    this.grouped = [];

    for (const username in groupedByUsername) {
      await this.publishNewsToDestinationChannel(
        this.groupMessages(username, groupedByUsername[username]),
      );
    }
  }

  async eventPrint(event) {
    const message = event.message;

    const channelId = message.peerId.channelId;

    // event придет несколько раз если в сообщении есть прикрепленные файлы
    // поэтому мы объединеям такие сообщения в одно.
    if (message.groupedId) {
      this.grouped.push({ channelId, message });
    } else {
      const username = this.listeningChannels.find(
        (listening) => BigInt(listening.id) === BigInt(channelId),
      )?.username;
      const grouped = this.groupMessages(username, [message]);

      this.publishNewsToDestinationChannel(grouped);
    }

    // А тут очищаем набранные сообщения через 5 секунд
    this.flushGrouped();
  }

  async getChannelsInfo(id) {
    return this.client
      .invoke(new Api.channels.GetChannels({ id }))
      .then(({ chats }) =>
        chats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          username: chat.username,
        })),
      );
  }

  async addChatsToListener(chats) {
    this.stopListener();
    const newChats = [
      ...new Set(
        this.listeningChannels.map(({ username }) => username).concat(chats),
      ),
    ];

    await this.listen(newChats);
  }

  async removeChatsFromListener(chats) {
    this.stopListener();
    const newChats = this.listeningChannels
      .filter(({ username }) => !username.includes(chats))
      .map(({ username }) => username);
    await this.listen(newChats);
  }

  stopListener() {
    return this.client.removeEventHandler(this.eventPrint);
  }

  async listen(chats) {
    if (!chats.length) {
      return;
    }
    this.listeningChannels = await this.getChannelsInfo(chats);
    this.client.addEventHandler(this.eventPrint, new NewMessage({ chats }));
  }

  async getNewsFrom(from, { limit = 10, offset = 0 } = {}) {
    const history = await this.getHistory(from, { limit, offset });

    // От API приходит так что 0 - самая свежая, мы делаем наоборот
    const messages = history.messages.reverse();

    return this.groupMessages(from, messages);
  }

  async publishNewsToDestinationChannel(news) {
    return Promise.all(
      news.map(({ from, ids }) =>
        this.forwardMessages({ from, ids, toPeer: this.destinationChannel }),
      ),
    );
  }

  forwardMessages({ from, ids, toPeer }) {
    return this.client.invoke(
      new Api.messages.ForwardMessages({
        fromPeer: from,
        id: ids,
        toPeer,
        dropAuthor: true,
        silent: false,
      }),
    );
  }

  async checkUsername(username) {
    const result = await this.client.invoke(
      new Api.channels.CheckUsername({
        channel: username,
        username: username,
      }),
    );

    return result;
  }
}

export const telegramApi = new TelegramApi();
