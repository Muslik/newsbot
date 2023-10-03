import Joi from 'joi';
import { telegramApi } from '../api/telegramApi.js';

export class Channel {
  /**
   * @param {{ name: string, isDisabled: boolean }} props
   */
  constructor({ name = '', isDisabled = false }) {
    this.name = name.trim();
    this.isDisabled = isDisabled;
  }

  /**
   * @param {Channel} channel - Name of channel
   */
  static async validate(channel) {
    const schema = Joi.object({
      name: Joi.string().required().not(''),
      isDisabled: Joi.boolean(),
    });

    const validation = schema.validate(channel);

    if (validation.error) {
      return { error: validation.error.details[0].message }
    }

    const isChannel = await telegramApi.checkIfChannel(channel.name)
    if (!isChannel) {
      return { error: `${channel.name} is not a channel`}
    }

    return { error: null };
  }
}
