import { Channel } from "../models/channelModel.js";

const DB_NAME = "channels";

export class ChannelRepository {
  /**
   * @param {import("knex").Knex} knex - The Knex instance
   */
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Create a channel
   * @param {Channel} channel - channel to create
   */
  async create(channel) {
    const [created] = await this.knex(DB_NAME).returning("*").insert(channel);
    return created;
  }

  findAll() {
    return this.knex(DB_NAME).select("*");
  }

  findById(id) {
    return this.knex(DB_NAME).select("*").where("id", id).first();
  }

  findByName(name) {
    return this.knex(DB_NAME).select("*").where("name", name).first();
  }

  updateDataById(id, data) {
    return this.knex(DB_NAME).where("id", id).update(data);
  }

  removeById(id) {
    return this.knex(DB_NAME).where("id", id).del();
  }

  removeByName(name) {
    return this.knex(DB_NAME).where("name", name).del();
  }
}
