## Architectural details

Webfleet is not a piece of software, it is (rather, it's going to be) a suite of different blocks
that can be stacked together however the user likes to make a website.
The main pieces can be described as

* Driver: a layer that allows to create/edit pages and keep them in an orderly and human-friendly fashion
* Domains: multitenancy layer that allows an user to handle multiple websites. Useful for companies
  or freelancers that need to handle many websites at the same time.
* Publisher: a layer that publishes the content for the world to see it
* Query side: a layer that provides the publisher side APIs to search content in the best possible way
* Auth side: a layer that provides authentication to access any of the former pieces.

[![Architecture diagram](/static/images/webfleet/webfleet-architecture.png)](/static/images/webfleet/webfleet-architecture.png)

## Domain

To keep everything tidy and human-friendly, the domain structure will be simple and borrow familiar
concepts from computer usage, such as

* Folders
* Pages
* Calendars
* Updates

As explained in the following schema

[![Domain diagram](/static/images/webfleet/webfleet-domain.png)](/static/images/webfleet/webfleet-domain.png)

## Eventsourcing

After reading an endless number of papers on the subject of what would be the best way to implement
a microservice architecture, I decided to give
[eventsourcing](https://martinfowler.com/eaaDev/EventSourcing.html) a shot.

I then proceeded to analyse which commands could be issued from an user and to determine the events
that would be emitted when the command passes validation.

Here a small summary, that might not be yet complete, of the commands.

[![Commands diagram](/static/images/webfleet/webfleet-commands.png)](/static/images/webfleet/webfleet-commands.png)

## Infrastructure

To test all this I decided to get a free plan on heroku. I also combined it with Github actions to
create pipelines that would test and deploy the code for each Pull Request.

This proved useful to get insights on CI/CD.

Keep following this page for updates!