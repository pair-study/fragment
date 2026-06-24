import type { ApiId } from "@/utils/mapper";

export type AuthenticatedUser = {
  id: ApiId;
};

export type RequestOrganization = {
  id: ApiId;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    organization?: RequestOrganization;
  }
}

export {};
