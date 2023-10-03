export class ServerError {
  constructor(error) {
    this.success = false;
    this.error = error;
  }
}
