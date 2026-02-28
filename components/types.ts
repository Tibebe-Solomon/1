export type Sender = "user" | "vynthen";

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  createdAt: Date;
  isAgent?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

