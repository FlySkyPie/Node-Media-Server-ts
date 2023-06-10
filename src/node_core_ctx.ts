//
//  Created by Mingliang Chen on 18/3/2.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
import EventEmitter from 'events';

import type { IPublisherSession } from './interfaces/publisher-session';

export const publisherSessions = new Map<any, IPublisherSession>();

export const playerSessions = new Map<any, any>();

export const sessions = new Map<any, any>();

export const publishers = new Map();

export const idlePlayers = new Set();

export const nodeEvent = new EventEmitter();

export const stat = {
  inbytes: 0,
  outbytes: 0,
  accepted: 0
};

export default { publisherSessions, publishers, idlePlayers, nodeEvent, stat, sessions };
