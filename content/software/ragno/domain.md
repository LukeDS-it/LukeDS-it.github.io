---
title: "Ragno's Domains"
date: 2022-07-15T20:40:00+02:00
description: >-
    The first thing to do when thinking about event-driven architectures is understanding
    the domain of the system and the various components. This page will explain the domains
    that we can find in Ragno, what are the aggregates, the events, etc.
---

We can't consider to use eventsourcing without adding [Domain Driven Design][1]
to the equation.

What this page is about is laying the foundations on which I am going to build the
project from. I will discuss about what are the domains of the whole application,
the aggregates, the actions that users can do (which will become the main events in
Ragno).
Some of these domains correspond to components that are not in the architecture document
because they are secondary to the main project.

As I understood, this step is paramount to have a well-designed system, and
even if in the end you're going to end up with a single application that handles
these domains, for example because you might be limited by your deploy infrastructure,
they will still be **separated** from each other and you're still
**not** going to have to deal with a monolith. The domains can then be split into
multiple services at a later date, effortlessly.

## The basic business domain: Website

The first domain that we are going to discuss, is the main operating area of Ragno:
the Website.

The website will be our primary aggregate, and the Domain root is the website's name
(or, its *domain*). From here on, I will distinguish a DDD Domain by using the capital
D and the website domain by calling it web-domain (even though I know it may not sound
appropriate, but it's for the sake of clarity)

First of all, why making the Website the primary Domain and aggregate?
Why not choosing, for example, the web page?

Well, it really is a matter of preference, I would say. Speaking in domain-driven
terms, the web page could be an aggregate with root the web-domain, and holding references
to the roots of other Domains, namely the web pages, which in turn would be aggregates
having as root their URI and be composed of the stuff that makes up the page itself
(title, content, description, tags, etc...).
Here the considerations that brought me to the final decision to have
the website as Domain:

- Having the web page as a separate Domain, would mean having ALSO the website as
  another Domain. This meaning that I would need two different components to manage
  them both. Trivial, but it's important too in a perspective of deploying stuff.
- Sure, the web page looks like an entity in itself, that could be linked to the
  website by referencing the URI, but let's compare this situation with that of
  an online store, where the primary Domain (aka our website) of the invoice links to
  the Domain of the product (aka our webpage). In that case,
  the product and the invoice live as separate entities because many invoices can
  link to the same product, but it's not true with our web pages: they are only
  property of the website, and the actions that we do on our website (among others)
  are those of adding, editing, deleting them.
- Seeing it in the event sourcing perspective, each Domain Entity has its own stream
  associated with it. More specifically, having both web pages and websites would mean
  having one stream for each website and one stream for each page of each website, making
  the streams rapidly grow in number.
- Having a stream for each page would be pointless. Thinking that each stream
  contains the lifecycle of each Entity, most of the time we would end up with streams
  that are quite empty, because in a website you can insert, edit or remove a page and
  that's pretty much it, making the stream of the web page not much different than, say,
  an Elastic document where I can store the content of the page and its history.
- When thinking about the components of the system, I know there will be a component
  that listens to changes to the whole website, and it's much easier to control a single
  stream made of all the messages that flow into the various website streams, rather
  than building projection out of all the webpages in a website.

I hope this clarifies my choice, it was really useful to write down my thought process
because it made me question every decision at each word I wrote, and led me to
read more documentation and examples until I was satisfied that my approach sounded
logical enough to go forward to the next step, which is the definition of the actions
that an user can do on the Domain.

### Actions related to the Website domain

This sounds easy enough, so I will describe the main actions that I think an user wants
to do with their website.

| Action | Event name |
|--------|------------|
| Start to manage their domain | DomainRegistered |
| Configure the template of the site | DomainTemplateSelected |
| Configure the publishing options | DomainPublishingOptionsChosen |
| Add a new page | PageAdded |
| Edit the page content | PageContentEdited |
| Edit the page title | PageTitleEdited |
| Move the page up in the menu | PagePriorityIncreased |
| Move the page down in the menu | PagePriorityDecreased |
| Publish a page | PagePublished |
| Unpublish the page | PageMarkedAsDraft |
| Delete a page | PageDeleted |
| Add a file resource | ResourceUploaded |
| Replace a file resource | ResourceReplaced |
| Delete a file resource | ResourceDeleted |
| Share the website workspace with someone | WebsiteShared |

This a list of events that the domain component will handle. The shape of the events
is out of the scope of this page, and I still have to find a way to make an effective
documentation about that.

## Secondary Domain: Users

If I wanted to make good use of the platform and allow others to manage their websites,
then the User is another Domain that I must handle.
I have also chosen not to handle users myself and instead rely on a third party that
knows better how to authenticate users than I do: firebase.

The domain of the users still exists though, and it would be wrong to ignore it just
because it is handled by something else. Also, some features mentioned above
might actually need the domain being there in the first place.

### Actions related to the Users Domain

The users will be able to

- Register (`UserRegistered`) to Ragno
- Invite other users (`UserInvited`) to allow them to work on their website.
  This event will be a "projection" event, and will be emitted when the component
  listens to a `WebsiteShared` event that targets an user that does not exist in
  the system.
- Remove their account from the system (`UserClosedAccount`)

But it could also be that as administrator I need to block / remove an user by myself
so two more events are needed

- `UserBlocked`
- `UserBanned`

And this wraps up the basic of the domains of Ragno. Surely more will be to come,
as I think up new requirements and features, but that's for the future.

[1]: https://martinfowler.com/bliki/DomainDrivenDesign.html

