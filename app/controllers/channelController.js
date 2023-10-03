import { telegramApi } from "../api/telegramApi.js";
import { Channel } from "../models/channelModel.js";
import { ChannelService } from "../services/channelService.js";
import { ServerResponse } from "../responses/serverResponse.js";
import { ServerError } from "../responses/serverError.js";

export class ChannelController {
  /**
   * ChannelController constructor
   * @param {ChannelService} channelService - Instance of ChannelService
   */
  constructor(channelService) {
    this.channelService = channelService;
  }

  /**
   * Handles getting all subscribed channel
   * @param {import('fastify').FastifyRequest} request - Fastify Request Instance
   * @param {import('fastify').FastifyReply} reply - Fastify Reply Instance
   * @returns {Promise} - Promise representing the subscribed channels
   */
  async getChannels(_, reply) {
    const channels = await this.channelService.getChannels();

    reply.send(new ServerResponse(channels));
  }

  /**
   * Handles add new subscribed channel
   * @param {import('fastify').FastifyRequest} request - Fastify Request Instance
   * @param {import('fastify').FastifyReply} reply - Fastify Reply Instance
   * @returns {Promise} - Promise representing the subscribed channels
   */
  async addChannel(request, reply) {
    const channel = new Channel(request.body);
    const validation = await Channel.validate(channel);
    if (validation.error) {
      reply.code(400).send(new ServerError(validation.error));
      return;
    }

    const isChannelExist = Boolean(
      await this.channelService.getChannelByName(channel.name),
    );

    if (isChannelExist) {
      reply
        .code(400)
        .send(new ServerError(`Channel ${channel.name} already exist`));
      return;
    }

    const createdChannel = await this.channelService.addChannel(channel);

    await telegramApi.addChatsToListener([createdChannel.name]);

    reply.send(new ServerResponse([createdChannel]));
  }

  /**
   * Handles removing subscribed channel
   * @param {import('fastify').FastifyRequest} request - Fastify Request Instance
   * @param {import('fastify').FastifyReply} reply - Fastify Reply Instance
   * @returns {Promise} - Promise representing the subscribed channels
   */
  async removeChannel(request, reply) {
    const { id, name } = request.body;
    if (!id && !name) {
      reply.code(400).send(new ServerError("Id or name should be specified"));
      return;
    }

    const removeResult = id
      ? await this.channelService.removeChannelById(id)
      : await this.channelService.removeChannelByName(name);

    if (removeResult.length) {
      await telegramApi.removeChatsFromListener(
        removeResult.map(({ name }) => name),
      );
    }

    reply.send(new ServerResponse(removeResult));
  }

  /**
   * Handles updating subscribed channel
   * @param {import('fastify').FastifyRequest} request - Fastify Request Instance
   * @param {import('fastify').FastifyReply} reply - Fastify Reply Instance
   * @returns {Promise} - Promise representing the subscribed channels
   */
  async updateChannel(request, reply) {
    const { id } = request.body;

    if (!id) {
      reply.code(400).send(new ServerError("Id should be specified"));
      return;
    }

    const channel = new Channel(request.body);
    const validation = await Channel.validate(channel);

    if (validation.error) {
      reply.code(400).send(new ServerError(validation.error));
      return;
    }

    const updatedData = await this.channelService.updateChannelById(
      id,
      channel,
    );
    if (updatedData.isDisabled) {
      await telegramApi.removeChatsFromListener([updatedData.name]);
    } else {
      await telegramApi.addChatsToListener([updatedData.name]);
    }

    reply.send(new ServerResponse(updatedData));
  }
}
