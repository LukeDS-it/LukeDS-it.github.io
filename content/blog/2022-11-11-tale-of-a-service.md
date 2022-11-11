---
layout:      post
title:       "Tale of a service that never was"
date: 2022-11-11T15:27:00+0200
category:    self-learning
description: >-
             In our field, there is never a "right answer" to a problem. We can find dozens of
             solutions to deal with any particular challenge, there is no one-fits-all solution
             and in the end, as professionals, we need to compromise between what in our opinion
             is the "best possible solution" and a solution that allows to respect deadlines.
             One of my last jobs was working on a legacy system that needed a complete overhaul,
             and I learned how to make the ends meet by proposing and comparing multiple patterns.
---

Today's thoughts are centered on the way we, as software engineers, need to tackle problems.
There's more to programming than meets the eye. Code is the last part of the journey, and I dare
to say, the least important, in the face of a great and strong analysis work that lays the
foundation of the application's logic.

Here I present the process of analysis of a service that never saw the light of day, but the
memory of the journey really opened up my mind on how the process should be approached.

## Requirements gathering

The first part of the job was gathering requirements with the interested parties, in this case
I will say that they are a group of internal users that need to run matching of trainers to gym
members, for an online application that sends trainers to people that want private sessions.

The main requirement was to be able to match trainers by equipment that's needed for a certain
training session, and by the trainer's skill and skill level. The equipment level of detail
does not need to be fine-grain, it's just the type of equipment that matters (i.e. no make
or model is necessary for the filtering).

## Assessment of the existing architecture

There already was a database containing trainers, and a matching algorithm that matched them
based on some criteria like distance from the session and evaluation, so those criteria were
added to the requirements as well.
The database, though, was not well-shaped, as - for example - the geolocation of the trainer
was not in a spatial column, so trying to filter by location was done manually by the algorithm
by selecting _all trainers_ from the database, and calculating for each trainer the distance
from the point in question. Of course this was not even close to sub-optimal, and highlighted
that the old database had issues that needed to be solved before moving on to implement some
new features on a broken piece of software.

Of course, we cannot remake a service from scratch just because it feels right to do so, but
we need to provide to our "upper tier" valid reasons to start development on a new piece of
software rather than just modifying the existing one. Several arguments were presented in favor
of the first approach:

| **Pros of adding to the monolithic application**               | **Cons of using existing infrastructure**                                                                                                                                                   |
|----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Zero setup time for project scaffold / pipelines /environments | Monolith is already too heavily loaded, (memory and cpu), this would slow down the platform                                                                                                 |
| No additional infrastructure is needed                         | Java as main language, in a separate service we can use another language which makes us more productive (Kotlin?)                                                                           |
|                                                                | Need to connect to another datasource, we cannot use migrations for the new datasource (the same thing happened with another development in the past)                                       |
|                                                                | Other datasource issues: JPA will need to keep a lot of connections open to various databases, and the connection pools management might bring issues (it has already happened in the past) |
|                                                                | Any development on the monolith must be coordinated with other teams                                                                                                                        |
|                                                                | Any development on the monolith means we have to run regression tests even if the new functionalities aren't running yet                                                                    |
|                                                                | Development on the monolith means that any change on the new feature implies a total redeploy, which is time-consuming                                                                      |
|                                                                | It will add complexity to the current data structure. We once pledged to fully delete the monolith and split it, this would just go in the opposite direction                               |

Given these compelling arguments, the proposal of rebuilding from scratch was approved.

## There's more than one approach for everything

The things to consider when having to rebuild a system from scratch are many, but the most
important is probably thinking ahead and ensuring that what you are doing is going to be
maintainable in the future and can allow you to implement new features on top of it without
having to touch anything else that you have already done.

So there are (at least) three possible approaches, that were considered to create this new
service, from the one that's most familiar to developers, to the most dynamic and reactive one.

I'll briefly illustrate them and proceed to explain why I tried to convince the team I was working
with on a certain approach.

First of all, regarding skills and equipments, the most straightforward solution (even comparing
an inherited matching system of a partner of our company) was to put everything in a single table
that looked like the following:

| **type**  | **api_value**    | **label**                                          |
|-----------|------------------|----------------------------------------------------|
| skill     | cross-fit.1      | Crossfit: beginner                                 |
| skill     | cross-fit.2      | Crossfit: intermediate                             |
| skill     | cross-fit.3      | Crossfit: pro                                      |
| equipment | snorkel          | Snorkeling equipment                               |
| equipment | kettlebell-light | Set of light kettlebell (from 10 to 20kg)          |
| equipment | kettlebell-mid   | Set of medium-weight kettlebells (from 20 to 40kg) |

This could allow us to add more matching criteria on-the-go without devising new tables
or flags on the main entity (yes, the old database had a has_xxx flag for each new equipment
that wasn't previously considered).

But this was the easiest part, the most complex work was deciding how we would store and
search for trainers in the new system.

### The simplest approach

The simplest approach, that can be done in a short period of time and all developers are familiar
of, is to create a simple CRUD service, with all our neatly `join`ed tables, trainer, trainer_skills
etc. But in the long term, this could become unmaintainable if the features start to differ from
the ones that a simple CRUD application can give. It could also complicate a bit the SQL queries
to get the data we need for the matching.

### A hybrid approach

A second approach, a bit more evolved, still makes use of a relational database, but  leveraging the
features of some relational databases like PostgreSQL, that allow working with lists:
when saving a trainer's skills and equipment, for example, we can put the lookup's `api_value` 
coming from those tables in the same "record" within a list field.

We can then index those fields to improve search times.
When we need to search for equipment or skill, it will be handled by the underlying database,
we just need to pass the api value of the skill/equipment we want to search for.

### Event-sourced approach

Another possible solution, that would benefit the search functions, could be to use event sourcing
extensively and create specific read models for the use cases that we want to support
(for example a specific read model for the matching):

instead of having a table that contains all the trainers data, along with list fields
for equipment and skills, we could instead:

- Drop the trainers table in favor of reconstructing the whole entity on-demand based on the
  single trainers's event stream (which is 100% event-sourcing behavior)
- Create one table for the matching search criteria, for example `filter_criteria`, 
  and use that as our read model for searches.

In this way, it would be much easier to create a query to search for trainers matching a certain
set of criteria, because it would be a select with a group by; additionally, we don't need all the
trainers information during this kind of searches for the matching, so it is not really necessary to
keep everything in one table.

This solution would be like creating our own indexes for trainers based on the most used
search criteria.

We would, of course, have a giant table with many duplicates,
but that would be the same intermediate table built by the database using joins,
so we would be "sparing" the database the useless job of reconstructing that join table each time.

As an example, the following table and queries can be tried on your local database or on db-fiddle:

Schema:

```sql
create table trainers_view (
  trainer_id bigint not null,
  filter_criteria varchar (255) not null
);
```

Queries:

```sql
insert into trainers_view (trainer_id, filter_criteria) values
(1, 'skill-a'),
(1, 'skill-b.1'),
(1, 'skill-b.2'),
(1, 'skill-b.1'),
(1, 'equipment-a'),
(1, 'equipment-b'),

(2, 'equipment-c'),
(2, 'skill-c'),
(2, 'skill-d');

select trainer_id
from trainers_view
where filter_criteria in ('equipment-c', 'skill-c', 'skill-d')
group by trainer_id
having count (trainer_id) = 3
```

Note that:

1. The filter criteria column contains only the generic criteria api name up to the `.`
   in order to be able to filter by the general skill. The specific level can be used:
   1. either just shown in the front-end via a request to the trainers api
   2. if we need to order by skill level during the matching, then this can be done in a separate
      step during the matching after we get all the trainers that match a training session
   3. if we need to filter by skill level, maybe because we need to find the trainer manually
      using the front-end, we could always add another column such as "full_criteria" or
      "advanced_criteria" to allow for this.
2. The problem above remains true also for the list-in-column approach presented before,
   as the list fields in Postgresql do not support filtering for the contents of a list beginning
   with something (i.e. `like 'skill-a%'` syntax)
3. If we need to filter for other "fixed" criteria such as trainer's name "like", trainer's email
   "like", geo-location, etc, we would need to add to the table one column for each new search
   criteria, and in all columns these data will be equal and repeated.
   This basically already happens under the hood when we join tables, but it feels like it
   needs to be stressed
4. This method of building tables looks counter-intuitive and against the best principles of
   database development, but the table is just a projection made to simplify searches,
   like the views that most databases support (pgsql, oracle, mssql, etc.)

## How does it scale?

How will the event-sourced approach work when adding new search criteria? Let's put it into
a real-life use case, because while we were busy doing the analysis work above, the requirements
already changed, and our team also wants matching by

- travel time (not distance)
- blacklist (e.g. I don't want the trainer X to be selected to work for gym G)
- whitelist (e.g. I only want trainer X, Y and Z to be selected to work for gym G)
- ratings of the trainer

### Travel time

Let's say we want to add to our basic skills + equipment matching the travel time of the rainer.

To calculate the travel time, there are APIs like Heremap that allow us to create an isoline of
travel, meaning that if we give as input the location of an order, we can get a polygon
within which (for example) all points are at a maximum of 45 minutes.

All we need to do, then is to add to our matching table a column that states the position
of the trainer, in spatial coordinates (e.g. PostGis extension for PostgreSQL),
then we can filter all trainers that are inside said polygon with a simple `and` condition.
We then rebuild the read-model from scratch reading the stream of events from the beginning.

The read model has changed, the source of truth has not.

### Whitelist
Let's consider the whitelist case first, because it's simpler.

With the whitelist, we want that for a certain company all trainers are blocked, except the
explicitly enabled ones (kinda like firewalls' whitelists).

The whitelist criteria can be easily fitted into the `filter_criteria` column, such as:

```sql
insert into trainers_view (trainer_id, filter_criteria)
values (1, 'whitelist-{gym-id}');
```

and then our filter would not change at all, because we just need to add one condition in our `in` :

```sql
select trainer_id
from trainers_view
where filter_criteria in (
   'equipment-c',
   'skill-c',
   'skill-d',
   'whitelist-{org-id}' // <---
)
group by trainer_id
having count (trainer_id) = 4 // <--
```

Again, as before, once we did this, we can re-run the service that builds the read model reading
events from the beginning, without changing the code, and it would update the trainers view adding 
the needed information.

I will not add further notes on the many use cases that we can easily solve with this approach,
so I will proceed further with the last considerations

## Pros and cons of the approaches

As I said earlier in this long article, as engineers our job is not only to produce software,
but to be able to produce it efficiently, with good compromises on development speed and
future-proofing. I believe the main selling point of the event-sourced approach is the ability
to change the read model painlessly, and being able to add new search criteria for new use cases
long after the first data migration between systems has happened, as we would still retain all
data from a legacy table even after it's been long dropped.

I will nevertheless conclude with a comparison of the various approaches, a table that earned
the event-sourced approach a chance to be developed (but alas, for reasons that I won't explain
the project never took off):

| \*\*\*\*                 | **Classic relational**                                                                                                                                                                                                                                                                                                                                                                                                      | **Relational 2.0 with lists**                                                                                                                                                                                                                                                                                                                                                                                               | **Event sourcing**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Approach type**        | Classical approach understood by most developers out there, ramp-up time is decreased                                                                                                                                                                                                                                                                                                                                       | Somewhat classical approach, but makes use of functionalities of more advanced databases such as postgres' lists                                                                                                                                                                                                                                                                                                            | New approach, might be difficult to get started on it if the concept has not fully rooted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Ease of development**  | It could be difficult to keep track of more complex queries, with lots of joins or when having to create dynamic queries (e.g. queries that have different search parameters based on the inputs)                                                                                                                                                                                                                           | This approach takes away some of the most difficult aspects by leveraging lists, removing the need of joining tables.                                                                                                                                                                                                                                                                                                       | The read model is tailored with only the fields that are needed to solve certain problems, the queries are way simpler to read and debug.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Datasource integrity** | Updates on search criteria relies on join tables. If we use the JPA framework, though, there may be some concurrency issues (although I admit they may be a rare occurrence) when trying to modify an entity with a many-to-many relationship that is treated as a set on the same entity, because if two people are adding / removing different items, JPA relies on the last seen state.                                  | Updates on search criteria are a bit trickier because we need to modify the single source of truth, e.g. removing or adding items from a list in a row. This could cause concurrency issues e.g. when two users are trying to update the same record.                                                                                                                                                                       | Updating search criterias is easy, because we are in fact not doing it: a process is watching changes on the entity and will add / remove rows from a table according to the stream of events. Concurrency issues cannot happen as we are not modifying a locked record but simply stating a fact, that will be processed at a later time.                                                                                                                                                                                                                                                                                                                                       |
| **Code quantity**        | The code is structured as everyone is used to, simple CRUD application with the usual layers from the top level to business logic, to database.                                                                                                                                                                                                                                                                             | The code is structured as everyone is used to, simple CRUD application with the usual layers from the top level to business logic, to database.                                                                                                                                                                                                                                                                             | The code is structured a bit differently and could be difficult at first: for the read model it would have two outlets, one that reconstructs the entity directly from the events stream, the other that only works on the read model.<br />We would also need to create a separate process that continuously reads and keeps track of the events that it has already seen, to keep the read model up to date.                                                                                                                                                                                                                                                                   |
| **Code structure**       | In this approach, the business / service classes could grow without control, because all CRUD functions would logically "belong" to the same scope.<br />If we decide to clean up and split service classes it will by developer's choice and sensibility, and once a class is split into two (or more), the complexity of the project will grow, making it less and less intuitive to search the things you're looking for | In this approach, the business / service classes could grow without control, because all CRUD functions would logically "belong" to the same scope.<br />If we decide to clean up and split service classes it will by developer's choice and sensibility, and once a class is split into two (or more), the complexity of the project will grow, making it less and less intuitive to search the things you're looking for | The code is kept into separate, small and airtight modules, one for the write side, one for each read side, and they are completely independent, to the point that each one could be its own service. The code is divided like this by design, not because we decide to separate the contents of classes because they're growing big.                                                                                                                                                                                                                                                                                                                                            |
| **Flexibility**          | This solution is the least flexible. Adding new search criteria would mean heavy restructuring of both database and code, ensuring migrations go as planned, makes rollbacks relatively complicate and needs to rely on feature flags during said migrations to ensure safety of rollbacks                                                                                                                                  | This solution is a bit more flexible as it relies less on join tables and more on a single column with multiple search criteria. When considering new use cases we could apply the same method of adding a new row or filter criteria, keeping database changes to minimum                                                                                                                                                  | This solution is the most flexible, as it relies as its single source of truth on a series of facts written in stone.<br />Any new use case can be derived from the existing data by using projections on the stream of the entity. It also enables to parallelize work better: if we need to start tracking a new field for the trainer, we can already start writing the event in the new form, and derive the proper read model at a later time, or write it in parallel, so people working on a new feature would be almost independent, the write and read side can work and deploy even on production environments on their own paces (enables real continuous deployment) |
| **Front-end**            | The front-end will rely on REST API for everything, this is the standard way of operating for front-ends                                                                                                                                                                                                                                                                                                                    | The front-end will rely on REST API for everything, this is the standard way of operating for front-ends                                                                                                                                                                                                                                                                                                                    | The front-end can operate in two ways, either with classical REST based APIs if we can't afford to change our way of operating, or on completely asynchronous API channels such as websockets. By sending commands to the backend and receiving responses at a later time, the front-end would become much more reactive and almost real-time.                                                                                                                                                                                                                                                                                                                                   |
| **Migration**            | The migration needs to target the end DB and if the target DB is subject to many changes it could be difficult to migrate to a new schema once the starting data is gone                                                                                                                                                                                                                                                    | The migration needs to target the end DB and if the target DB is subject to many changes it could be difficult to migrate to a new schema once the starting data is gone                                                                                                                                                                                                                                                    | With an event storage we can migrate all trainers one time only, keeping all the data from our current production environment and we will be able to progressively choose which and how to translate them in the new target read models. Even if we make hundreds of changes to the read model we will always have the complete history of how the data has changed through time                                                                                                                                                                                                                                                                                                 |
| **Debugging**            | It's a bit difficult to replicate issues using production data in a local environment                                                                                                                                                                                                                                                                                                                                       | It's a bit difficult to replicate issues using production data in a local environment                                                                                                                                                                                                                                                                                                                                       | Debugging is simplified by watching the event stream. If something goes wrong we can simulate the remote environment in local at any point in the broken entity's history by reading the history of the entities directly from the production data source in our local environment. It also leaves more traces than simple logging.                                                                                                                                                                                                                                                                                                                                              |
| **Fixing data**          | Fixing data is easily done with tools like the query launcher. If an entity is broken, we can fix it in a matter of minutes using a SQL query.                                                                                                                                                                                                                                                                              | Fixing data is easily done with tools like the query launcher. If an entity is broken, we can fix it in a matter of minutes using a SQL query.                                                                                                                                                                                                                                                                              | Fixing data is a bit more complex, as we would need to take into account compensation events: the service producing the read model has to be made aware of the possible compensation events that exist for a certain entity, and we would have to predict in advance all possible unlucky cases.<br />It's also true that this methodology **should prevent** these occurrences by design but we can't exclude that unlucky events still happen.                                                                                                                                                                                                                                 |
| **Technology**           | We already have tons of experience with proven frameworks to do this kind of applications                                                                                                                                                                                                                                                                                                                                   | We have a bit less experience on using the special pgsql columns, but the framework point of the other solution still applies                                                                                                                                                                                                                                                                                               | We would need to find a good framework to work with event sourcing, install an event storage and learn to manage it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Summing up, the benefits of the traditional approaches are in the short-term vision: more developers
can start up the job without having extended knowledge as the approach does not differ from the 
day-to-day one. On the other hand, before starting the development we need to have a crystal-clear
vision of everything we have to implement from day one, and making sudden last-minute changes, 
or post-migration changes could prove very difficult.

The benefits of event-sourcing are on the long-term vision: although it's going to be a bit more
difficult to start up, having last-minute changes or post-migration changes would be less
problematic, because we would be able to reconstruct a new data model, even from scratch,
in considerably less time, and we would not have to touch anything else other than the part
that builds the read model, all the write part can stay as-is in most cases.

Also, maintenance and code readability would be in my opinion greatly improved
(shorter sql queries, no joins, high code decoupling, etc.)

That's enough writing for today, in the future I'll also approach the topic on how to
plan the migration of the database without impacting the day-to-day work of our colleagues.

Thanks for reading!

L.
