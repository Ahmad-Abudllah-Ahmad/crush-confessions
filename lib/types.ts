export interface Confession {
  id: string;
  content: string;
  timestamp: string;
  status: string;
  visibility: string;
  likes: number;
  comments: number;
  senderName?: string;
  targetUserName?: string;
  hasLiked?: boolean;
  isSender: boolean;
  isReceiver: boolean;
  senderRevealed: boolean;
  receiverRevealed: boolean;
  mutualReveal: boolean;
  chatChannelId?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    displayName: string;
  };
  isAuthor: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  createdConfessions: number;
  receivedConfessions: number;
}