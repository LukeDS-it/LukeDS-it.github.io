---
layout: page
title: Webfleet
permalink: /software/webfleet/
description: >-
             Webfleet is a headless and distributed CMS, created leveraging the microservice
             architecture. It can be used as a service or by installing the relative parts on a
             dedicated infrastructure.
---

<div class="warning">
  <ul>
    <li>
      Webfleet was born to put into practice my studies on the microservice architecture. It is free
      software and can be used as-is, with no guarantee that it will serve the purpose you have in mind.
    </li>
    <li>
      It has flaws due to being unable to fully test on a distributed environment, which I plan
      to smooth out as time goes by and my experience grows.
    </li>
    <li>
      Finally, it's still on development: so many of the things written here are still concepts, so
      not implemented or fully working, but the idea is to arrive to implement everything.
    </li>
  </ul>
</div> 

## What is this?

Webfleet is a headless, distributed, multi-tenant CMS which aims to take care of all the aspects
of website creation, from the set-up to the content creation.

Webfleet is composed of multiple pluggable pieces, each one of them takes care of a different
aspect of the website creation process:

* webfleet-domains: this piece allows an user to handle multiple websites. This was created to
  simplify setup of multiple websites without having to deploy multiple instances of the webfleet
  system. Useful for companies that want to provide webfleet as a service, or freelancers that want
  to register to an application that handles multiple websites without having to switch frameworks.
  It also handles the configuration of the websites, so you'll be able to specify which rendering
  engine will be applied to each one of them, customise the SEO experience and much more.
* webfleet-driver: this piece is the core of the application, and allows to create pages and keep
  them ordered and tidy in a human-readable fashion: the concept is borrowed from any file system
  manager to be easy and familiar: you will be able to order your pages and events in nested folders
  and will have a dedicated blog container.
* webfleet-editor: the front-end application that connects all the pieces together in an
  user-friendly interface. It will allow to create websites, configure plugins, create contents
  and share the website with other users.
* webfleet-builder: this piece is the worker that will gather all information entered in the other
  services and will build the website. It will support multiple outputs modes, in this way companies
  and freelancers will have just one entry point for website editing, and will be able to output
  * plain html pages (with optional export to GDrive function)
  * websites made with Jekyll and published on a github repository
  * Websites made with Wordpress
  * Websites made with Joomla

## How do I use it?

### Webfleet as a service
You will be able to use webfleet as a service, by connecting to an url, and completing the
registration.
The infrastructure is provided by heroku's free tier, so the application will be unstable at times.
If the project gains interest, I will likely expand it further and try paid plans or other options
in order to render it more stable and scalable.

### Webfleet as software
All the pieces that compose webfleet are available as docker containers, here the list of each
one of them with the current version and link to the public repository.
You can deploy them on your own infrastructure free of charge, though it would be nice of you
to mention where the software comes from, and to send me an e-mail so I can track here a list
of who is using it.

In each repository you'll find detailed information on how to configure the deploy environment.

|      Piece       |    Description   |                    Github                     |                              Docker hub                              |
|------------------|------------------|-----------------------------------------------|----------------------------------------------------------------------|
| webfleet-domains | for multitenancy | https://github.com/LukeDS-it/webfleet-domains | https://hub.docker.com/repository/docker/ldsoftware/webfleet-domains |
| webfleet-driver  | content factory  | https://github.com/LukeDS-it/webfleet-driver  | https://hub.docker.com/repository/docker/ldsoftware/webfleet-driver  |
| webfleet-editor  | Front-end        | https://github.com/LukeDS-it/webfleet-editor  | Not available yet                                                    |

 