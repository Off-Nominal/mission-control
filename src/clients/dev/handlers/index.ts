import { Client } from "pg";
import handleMessageCreate from "./handleMessageCreate";

export default function genereateDevHandlers(db: Client) {
  return {
    handleMessageCreate,
  };
}
