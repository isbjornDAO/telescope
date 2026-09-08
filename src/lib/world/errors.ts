export class WorldError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "WorldError";
    this.status = status;
  }
}
