import posts from "./blog.json";
import type { BlogPost } from "../lib/content";

export type { BlogPost };

// Posts are edited through /admin and stored in blog.json.
export const blogPosts: BlogPost[] = posts;
