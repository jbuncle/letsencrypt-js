import type { ChallengeHandlerI } from "./ChallengeHandlerI";

export interface ChallengeHandlerFactoryI {

    create: () => ChallengeHandlerI;
}