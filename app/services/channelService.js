import { Channel } from "../models/channelModel.js";
import { ChannelRepository } from "../repositories/channelRepository.js";

export class ChannelService {
  /**
   * ChannelService constructor
   * @param {ChannelRepository} channelRepository - Instance of ChannelRepository
   */
  constructor(channelRepository) {
    this.channelRepository = channelRepository;
  }
  /**
   * @param {Channel} channel
   */
  addChannel(channel) {
    return this.channelRepository.create(channel);
  }

  getChannels() {
    return this.channelRepository.findAll();
  }

  async removeChannelByName(name) {
    //  Don't know how to return deleted instance otherwise;
    const deleting = await this.channelRepository.findByName(name);

    if (deleting) {
      await this.channelRepository.removeByName(name);
      return [deleting];
    }

    return [];
  }

  async removeChannelById(id) {
    //  Don't know how to return deleted instance otherwise;
    const deleting = await this.channelRepository.findById(id);

    if (deleting) {
      await this.channelRepository.removeById(id);
      return [deleting];
    }

    return [];
  }

  async updateChannelById(id, data) {
    await this.channelRepository.updateDataById(id, data);
    //  Don't know how to return updated instance otherwise;
    const updating = await this.channelRepository.findById(id);
    if (updating) {
      return updating;
    }

    return null;
  }

  /**
   * @param {String} channel name
   */
  getChannelByName(name) {
    return this.channelRepository.findByName(name);
  }
}
