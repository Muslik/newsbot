import Fastify from "fastify";
import cors from '@fastify/cors'
import knex from "knex";
import { telegramApi } from "./api/telegramApi.js";
import { config } from "./config.js";
import knexConfig from "./db/knexfile.js";
import { ChannelRoutes } from "./routes/channelRoutes.js";
import { ChannelRepository } from "./repositories/channelRepository.js";
import { ChannelService } from "./services/channelService.js";
import { ChannelController } from "./controllers/channelController.js";

const fastify = Fastify({
  logger: false,
});
await fastify.register(cors)

const knexInstance = knex(knexConfig);

const channelRepository = new ChannelRepository(knexInstance);
const channelService = new ChannelService(channelRepository);
const channelController = new ChannelController(channelService);

fastify.register(
  (fastify, opts, next) =>
    new ChannelRoutes(channelController, fastify, opts, next),
);

telegramApi.start(config.primaryChannel).then(async () => {
  const channels = await channelRepository.findAll();
  telegramApi.listen(
    channels.filter(({ isDisabled }) => !isDisabled).map(({ name }) => name),
  );
});

const start = async () => {
  try {
    await fastify.listen({ port: 3009, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
