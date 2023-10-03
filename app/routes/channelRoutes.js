import { ChannelController } from "../controllers/channelController.js";

export class ChannelRoutes {
  /**
   * Initialize routes
   * @param {ChannelController} controller - ChannelController instance
   * @param {import("fastify").FastifyInstanceh} fastify - Fastify instance
   * @param {import("fastify").FastifyPluginOptions} opts - Options
   * @param {Function} next - Next function
   */
  constructor(controller, fastify, _, next) {
    fastify.route({
      method: 'GET',
      url: '/channels',
      handler: controller.getChannels.bind(controller),
    });

    fastify.route({
      method: 'POST',
      url: '/channels',
      handler: controller.addChannel.bind(controller),
    });

    fastify.route({
      method: 'DELETE',
      url: '/channels',
      handler: controller.removeChannel.bind(controller),
    });

    fastify.route({
      method: 'PATCH',
      url: '/channels',
      handler: controller.updateChannel.bind(controller),
    });

    next();
  }
}
