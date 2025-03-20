---
layout: post
title: Full vs incremental load
date: 2025-03-20 00:00:00
description: Explaining pros and cons of Full Load vs Incremental Load
tags: data_engineering ingestion
categories: learning

toc:
  beginning: true
---

# Introduction

In this [article]({% post_url 2025-02-21-oltp-vs-olap %}), we explored Online Transaction Processing (OLTP) database vs an Online analytical processing (OLAP) database and their purposes. We covered the idea that OLTP are meant for daily operations such as e-commerce transactions, where there is large volume of single transactions happening at any point in time, while OLAP are meant for analytical use cases.

Although we can technically still perform business-oriented queries on OLTP databases accepting the fact that it's slower, its also not recommended as we do not want to overload the database and risk having an outage. The OLTP database is what powers the webapp/app UI that the end users interface with and bringing the OLTP database down will be detrimental to the company.

Therefore to perform business-oriented queries, we would take the data in the OLTP databases and ingest/load them into an offline area. This can be in the form of a datalake such as S3 or into a OLAP database such as a data warehouse where there is no additional stress on the operational databases during heavy queries.

# Ingestion

There are 2 main type of data ingestion strategy, Full Load and Incremental Load. Each of them have their set of pros and cons and we will discuss about them in detail below. Another key point is that ingestions generally involves a source (e.g. API, database, filesystem) and a destination (e.g. database, filesystem).

## Full load

In a full load strategy, as the name suggests, the entire source data is read and loaded to the destination. If the destination already contains existing data, it will be deleted and replaced with the latest records that are coming in.

This method is usually used if the data we are processing is small enough, or during the initial setup and followed by an incremental load subsequently (more details later), or to refresh the data warehouse to the latest data. Full load can be time consuming as we are reading the entire data from the source. This also incur a sudden burst of stress for the source system especially if the data we are ingesting is large.

A Full Load should be done preferably when we know the traffic to the app and transaction to the source database is low so to avoid spike in resource consumption on the system.

### Pros

1. Complexity: Easy to setup a full load from the source system to the destination system. A naive way to think is a CTRL-C + CTRL V (overwrite existing data)
2. Data consistency: Data in the destination is consistent with the source system

### Cons

1. Ingestion Speed: Slow for large dataset as it requires a full scan on the source data
2. Stress on source system: Resource consumption (e.g. CPU) can spike during a full load especially if the data is large and may impact other applications that are running.

## Incremental Load

In an incremental load strategy, only the updated/newest data from the source system are loaded to the destination system. This results in lesser data being transferred between them which improves speed and reduces stress.

This method is useful for large data in the source system where doing a full load is not ideal, or if we wish to process data in smaller time intervals (e.g. hourly as we only need to process the new/updated data from the past hour).

Incremental Load can also be otherwise known as Change Data Capture (CDC) or Delta Load.

### Pros

1. Ingestion Speed: Faster than Full Load since we are only loading new/updated data.
2. Stress on source system: Less stress as we are only getting the new/updated data instead of the whole data table everytime.
3. Frequency of ingestion: Allows for flexibility of more frequent ingestion due to the above 2 reasons.
4. Scalability: Useful for large datasets.

### Cons

1. Complexity: Harder to implement. Requires additional columns (e.g. timestamp column), or other change data capture mechanism to reconcile the data. This requires more technical expertise.
2. Data consistency: Managing data consistency between the source and destination system is more complex as well. This can come in the form of schema evolution where a column changes data type, or missing data.

### Methods of Incremental Load

#### Timestamp based approach

{% include figure.liquid loading="eager" path="assets/img/2025-03-20-full-vs-incremental-load/1.png" class="img-fluid rounded z-depth-1" %}

In a timestamp based approach, the source table will need to have a timestamp column to reference, usually an `updated_at` column. Whenever a new record is added or an existing record (see Green) is updated in the source database, the `updated_at` column will reflect the latest timestamp. This allows us to keep track on the records that are updated after the last incremental load.

```sql
select *
from source_table
where updated_at > last_ingested_time
```

We can keep track of the last ingested time and identify new/updated records past the time.

If you want to indicate if a row is an INSERT or and UPDATE, then you may need to modify the setup by changing the query or adding new columns such as `created_at`.

In this approach, it'll be difficult to identify records that is deleted (see Red) in the source system unless we do some comparison between the source and destination tables to identify primary keys that do not exist in the source. This is what we call a soft delete approach where we can mark the record in the target table with an `is_deleted` flag.

#### Log based/Change data capture (CDC) approach

{% include figure.liquid loading="eager" path="assets/img/2025-03-20-full-vs-incremental-load/2.png" class="img-fluid rounded z-depth-1" %}

This method is applicable to source databases such as Postgres which contains transaction logs. These transaction logs store all events that allows the databse to be recovered in the event of a crash. We can utilise this logs to capture the transactions (e.g. insert/update/delete) and propagate it to the destination system. The data changes are captured in real time by connecting a tool to capture the data changes. This method will not require any scanning of the source database. However the additional complexity may come from the additional tool and configurations to the database for this to work.

## Summary table

|                  | Full Load                            | Incremental Load                                                   |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Data Volume      | Entire dataset overwritten each time | Only changed data needs to be processed (insert, update, delete)   |
| Frequency        | Less frequent                        | More frequent                                                      |
| Resource Usage   | Higher                               | Lower                                                              |
| Latency/Speed    | Slower                               | Faster                                                             |
| Complexity       | Simpler                              | Complex                                                            |
| Data consistency | Consistent since its an overwrite    | Requries reconciliation via some logic and risk being inconsistent |
