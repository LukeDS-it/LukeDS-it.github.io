---
title: "Architecture"
date: 2022-07-15T19:40:00+02:00
description: >-
    When thinking about the architecture, I focused primarily on extensibility and ease of
    maintainability. The approach that I've always wanted to try out, eventsourcing,
    promises a completely decoupled architecture that is easy to extend with components, so
    I thought to give this a try.
---

The architecture of Ragno is based on microservices and eventsourcing. In this page I will
briefly present the blueprint of the whole system, explaining what role each part plays
in the whole.

Let's start by showing the basic diagram of the components that make up the whole.

(TODO put an image)

## The event storage

The event storage is the most important part of the system, as it will be the single
source of truth of the system, and it will contain all the data relative to the
sites. It may sound counter-intuitive to have a distributed environment where every
service relies on a single data storage, but in the event-sourcing pattern this is
the norm: the event storage will be the main faucet from where all the service will
obtain data, and then each one of them will use that data to create its own private read
model that will allow it to be independent from the other services and (if needed) from
the single source of truth itself.

The event storage has the double function of being a data storage and a message bus,
since some services may be interested in some events only for triggering background
jobs.

The choice for the event storage, after much debate, went to [Event Store][1].
Initially - a long long time ago when my journey into microservices had just begun -
I was suggested using Kafka, but

- I've never found it attractive, because of its high complexity
- It is NOT the correct choice for an event store (in fact, it is a messaging system)

## The site manager

Moving down from the "city center", we encounter the first component, the most important
one at that, that is the site manager.

The site manager is the entry-point of the websites domain, and will emit all the events
that pertain to the sites domain (see the domains page for more information).

As anticipated, it won't be your classical CRUD application, as it will not generate data
that goes in a table, but events that will go directly to the event store.
It will nevertheless contain a read-model that will help taking decisions, e.g. if
the current user has the permission to act on a certain domain, or stuff like that.

## The site builder

The site builder is another component, but is not exposed to the network. It will
take care of building the websites based on the events that run into the main event
storage. The output of the build will be based on the website's configuration, so
this component will rely on read models to make up decision tables; and the website
itself is a read model too.

## The indexer

The site indexer is the third component that I plan to introduce in the system, and
it's another read-model that will listen to the events running through the system
and create a full-text search engine for the website pages. It will expose a
classical REST API that will allow the live site to query for its contents (e.g.
via a search bar) or any third party that wants to query the site.

## The UI

Finally, the UI is the only interaction point between the user and Ragno. It will
allow easy editing and managing of the websites.

[1]: https://www.eventstore.com/

