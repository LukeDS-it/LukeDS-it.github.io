---
layout:      page
title:       REACTing to change with microservices
permalink:   /software/reacting-to-change-microservices/
description: >-
             As time goes by, the user base of an application grows, and so does the application
             itself. To avoid that the heavy workloads and the growing codebase submerge us, and
             be reactive to changes and requests, the microservice architecture, if properly
             applied, can greatly help to keep the pace of evolution.
---

<div class="note">
    Please note: I am writing this page as personal notes while learning more about the microservice
    architecture. By writing this I aim to summarise and order concepts so that I will improve the
    learning process, hopefully this byproduct will be useful for other people as well.
</div>

We start by setting our desired achievement: the need to build a system that is _responsive_ to
users.

The [Reactive Manifesto][1] suggests us that if we want to achieve this,

> The system must be RESPONSIVE.

It must be maintainable, easily extensible and responding to the user in a timely
manner. This means that our system must be

> Resilient (stay responsive during failures)

and

> Elastic: react to variable loads in the same way 

and we can achieve this via the means of making it

> Message-driven

Let's think at the usual monolith model.

As the core business of a company grows, so does the application(s) that hold it together.
When offering new core services, more functionalities are added to the ones already existing
and it's not rare that something that was supposed to be "simple" and "used in only one occasion"
is instead reused, made to grow and in the end everyone who has worked on that project
loses track of what happened, and the outcome is a monolith, that nobody wants to touch ever again.

> Monoliths can quickly turn into nightmares that stifle innovation, progress and joy
> 
> -- [_Reactive microservices architecture: design principles for distributed systems (Bonér Jonas)_] [2]

A monolith might not be responsive/elastic, because

- there are many functions insisting on the same database, so querying becomes a bottleneck
  even if the queries are relatively simple
- some functions may overlap with others, for example transactions lock db resources until
  success or failure, thus that data is unavailable until the lock is released, leading to queueing
  and making seemingly unrelated functionalities actually interfere with each other
  
It might not be resilient: if one part of the monolith fails, everything breaks
- a simple hotfix requires restarting the whole system
- one failing piece of the applications can take the whole system down (even if it's non vital)

Some early attempts to make the application elastic just scaled the applications:
- vertically: adding more resources (CPU, RAM, etc.) might work at first, but there will always
  be a performance bottleneck, where adding resources will not make the application faster.
- horizontally: adding more copies of the same application could work, but a monolith is not easily
  scalable because of the reasons exposed before, also we have to consider other factors such as:
  - there might be scheduled jobs that need to run in a separate environment, and duplicating the
    application could bring to concurrency problems
  - we need to decouple the end user from the instance that executes the code (i.e. the user
    must receive the same response if asking something to any of the instances of the application)

Finally, message passing (most of the times) is not implemented in a monolithic application, where
all the needed services are in the same place and can be referenced anywhere in the code.

## The microservice approach

The ideas behind the microservice architecture have been around for a long time, but because
of technical constraints, it never really took place: the availability of machines was low,
multi-cores didn't exist, the network was slow, disks were expensive, RAM was expensive.

Now in 2020 these technical limitations are no longer a problem, and the ideas behind this
architecture can now be put into practice.

The architecture based on microservices, is basically a simple concept that revolves around having
a collection of small, isolated services, each one **owning** its data, isolated, scalable and
resilient to failure on its own. Those services interact with one another to form a system that
is "bigger than the whole" and gains more flexibility than the typical enterprise application
we're used to.

## What is a microservice?

"Micro" is not about the codebase size.
There isn't a real definition of microservice: one "service" on its own is just a service.
In order to talk about microservices, we must have many services that interact with each other, and
each service must do one thing, and do it well. It's the divide and conquer principle,
taken to the extreme.

## Reactive microservices

So let's see some examples where the microservices are reactive:

First of all, coping with load (Elasticity): as we said, each microservice owns its data. What is
the benefit of this?
Think about a mailing application, where we must store billions of Terabytes of data. There is no
possible hard disk that could take all that information. Instead, we can divide that data into
clusters, and each replica will be responsible for a sub-set of the whole data. Moreover in this way
we can also be more *Responsive* to users, because, for example, European users can have their
emails stored in a server close to (or in) Europe, thus reducing latency in the requests.
This wouldn't be possible with the classical approach.

Let's talk about Resilience. Resilience is the ability of recovering quickly from a situation out
of the normal.
The first thing we can point out is that, when a single service is not working properly, the other
parts are still working, and can take compensating actions until that service returns operational.
As an example, we might have something that caches data and returns that cached data if the main
provider is unreachable (eventually along with the indication that data might be stale)

[1]: https://reactivemanifesto.org
[2]: https://www.lightbend.com/ebooks/reactive-microservices-architecture-design-principles-for-distributed-systems-oreilly
