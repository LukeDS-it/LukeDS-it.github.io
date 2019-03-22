---
layout: page
title: Webfleet
permalink: /software/webfleet/
description: Webfleet is an attempt of making a distributed CMS, an experiment to learn microservice architecture
---

# Webfleet

Webfleet is a playful attempt at learning microservice-oriented architectures, whilst creating something I like:
stuff to make order.

## Architectural details

Webfleet is not a piece of software, it is (rather, it's going to be) a suite of different blocks that can be
stacked together however the user likes to make a website. The main pieces can be described as

* Driver: a layer that allows to create/edit pages and keep them in an orderly and human-friendly fashion
* Publisher: a layer that publishes the content for the world to see it
* Query side: a layer that provides the publisher side APIs to search content in the best possible way
* Auth side: a layer that provides authentication to access any of the former pieces.

![Architecture diagram](/static/images/webfleet/webfleet-architecture.png)

This is the theory behind the concept. Currently I am developing the following pieces:

* [Driver](https://github.com/LukeDS-it/webfleet-driver): layer created with Scala and Akka that publishes
changes on a Kafka topic
* Publisher (not yet started): The publishing layer is a jekyll instance: an actor system will be listening to a Kafka
topic and at each event will perform the update of the jekyll pages, pushing the changes to the online repository and
thus automating the release process. A JS architecture will be included in the jekyll template to allow advanced
features like the search feature.
* Query (not yet started): the query side will be a Scala/Akka system that will first read from Kafka the changes,
index them on an Elastic server, and then serve data to the front-end via appropriate APIs.
* Auth side: To authenticate on the driver, I will try to integrate Auth0 in the service. 

## Domain

To keep everything tidy and readable for humans, the domain structure will be reduced to the bare minimum, trying to
implement a filesystem-like structure. The structure is composed by

* Aggregates
* Contents
* Events
* Updates

As explained in the following schema

![Domain diagram](/static/images/webfleet/webfleet-domain.png)

## Eventsourcing

After reading an endless number of papers on the subject of what would be the best way to implement a microservice
architecture, I decided to give [eventsourcing](https://martinfowler.com/eaaDev/EventSourcing.html) a shot.

I then proceeded to analyse which commands could be issued from an user and to determine the events that would
be emitted when the command passes validation.

Here a small summary, that might not be yet complete, of the commands.

![Commands diagram](/static/images/webfleet/webfleet-commands.png)

## Infrastructure

To test all this I decided to get a free plan on heroku. I also combined it with TravisCI to create pipelines that would
first test and then deploy the code in each Pull Request on Github.

This proved useful to get insights on CI/CD.

