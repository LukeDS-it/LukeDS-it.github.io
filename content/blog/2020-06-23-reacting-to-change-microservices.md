---
layout:      post
title:       "REACTing to change with microservices"
date: 2020-06-23T22:15:00+0200
category:    self-learning
description: >-
             As time goes by, the user base of an application grows, and so does the application
             itself. To avoid that the heavy workloads and the growing codebase submerge us, and
             be reactive to changes and requests, the microservice architecture, if properly
             applied, can greatly help to keep the pace of evolution.
---

Please note: I am writing this page as personal notes while learning more about the microservice
architecture. By writing this I aim to summarise and order concepts so that I will improve the
learning process, hopefully this byproduct will be useful for other people as well.

The goal in software development, during modern times is to build a system that is _responsive_ to
users.

What does "responsive" means, in terms of user experience? A look at the [Reactive Manifesto][1]
tells us the meaning of this:

> The system must be RESPONSIVE: It must be maintainable, easily extensible and responding 
> to the user in a timely manner.

This means that the system itself must be

> Resilient (stay responsive during failures)

and

> Elastic: react to variable loads in the same way 

Finally, in its fourth point, the manifesto suggests that if we want to make all three possible,
our system should be

> Message-driven

The Reactive manifesto was born because the current expectations of programs by users have changed
in the course of the past years, and the old architectures do not suit well the model.

Let's think at the usual monolithic model:

As the core business of a company grows, so does the application(s) that hold it together.
When offering new core services, more functionalities will be added to the ones that already exist,
and it's not rare that something that was supposed to be "simple" and "used in only one occasion"
is instead reused, made to grow and in the end everyone who has worked on that project
loses track of what happened, and the outcome is a monolith, that nobody wants to touch ever again.

> Monoliths can quickly turn into nightmares that stifle innovation, progress and joy
> 
> -- [_Reactive microservices architecture: design principles for distributed systems (Bonér Jonas)_][2]

A monolith might not be responsive/elastic, because

- there are many functions insisting on the same database, so querying becomes a bottleneck
  even if the queries are relatively simple
- some functions may overlap with others, for example transactions lock db resources until
  success or failure, thus that data is unavailable until the lock is released, leading to queueing
  and making seemingly unrelated functionalities actually interfere with each other.
  Concurrent CRUD at high rates is difficult.
  
It might not be resilient: if one part of the monolith fails, everything breaks
- a simple hotfix requires restarting the whole system
- one failing piece of the applications can take the whole system down (even if it's non vital)

Some early attempts to make the application elastic just scaled the applications:
- vertically: adding more resources (CPU, RAM, etc.) might work at first, but there will always
  be a performance bottleneck, where adding resources will not make the application faster.
  (see: [Amdahl's law][3], [Universal Scalability Law][4])
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

"Micro" is not about the codebase size, rather, it's about the scope of its responsibility.
One service must do one thing, and do it well. It's the divide and conquer principle,
taken to the extreme.
We can't really talk about microservices if we have only one, though. So, the second
thing that makes a microservice, is that it comes with other microservices.

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
provider is unreachable (eventually along with the indication that data might be stale).

The solution for a failure might be to restart the node, or if it's too corrupted, to delete it and
create a new one somewhere else.

So how do microservice make everything responsive?

The two previous examples already talk by themselves: if something is not outright available,
a substitution is served. Data is not kept in a single, maybe far away place, but as close
as possible to the user. Single Pages Applications are too part of a microservice architecture,
because they shift the workload of building the interfaces close to where it's needed: the
user's browser.

All those services, finally, need a way to cooperate and run their job together. It's really
easy, though, to lose track of the application because it's distributed and each piece works
seemingly independently, it's not possible for a single person to grasp the whole system if
there is nothing that explains how the services talk together.
To be able to understand what the services do, we focus on the _message flow_ between the system:
each functionality (e.g. an user wants to write an email) is described via a flow, and the
interaction model of the back end becomes clearer.

There are many ways to implement message passing, which I will just mention (the topic is too
vast and can't be discussed in a simple presentation)
- fire-and-forget (tell pattern): a component sends a message and doesn't care about receiving
  an answer
- request-response pattern: a component sends a message and waits for a reply (blocking)
- ask pattern: a component sends a message and a response is sent either to the requester, or to
  another component that will continue the flow (non blocking)
- aggregator pattern: a component needs the responses of many services in order to fulfil a request
- saga pattern: used for transactions in microservices, one component will take care of all the
  steps of a transaction, and roll back everything when there's a failure.

## What's the catch?

Individual microservices are relatively easy to implement. What is hard in this architecture is
making them talk with each other, and manage an entire ecosystem of them:

- service discovery
- coordination
- security
- replication
- data consistency
- failover
- deployment
- integration with external systems

And this is just a partial list. As for the answers to this, at the time of writing, I feel that
I still need to get more knowledge in order to be able to undertake any of these.
All I can say is that I noticed that the only way to be able to surpass any of these problems is
to start working from the bases (start to create my own microservice environment) and search
for solutions whenever I come by a stop. Reading pre-made recipes is not for me, as sometimes
they do not explain to the full extent why some choices have been made.

This is all for this chapter, thanks for reading!

L.

[1]: https://reactivemanifesto.org
[2]: https://www.lightbend.com/ebooks/reactive-microservices-architecture-design-principles-for-distributed-systems-oreilly
[3]: https://en.wikipedia.org/wiki/Amdahl%27s_law
[4]: https://wso2.com/blog/research/scalability-modeling-using-universal-scalability-law#:~:text=Universal%20Scalability%20Law%20(USL)%20is,system%20level%2C%20and%20hardware%20level.
