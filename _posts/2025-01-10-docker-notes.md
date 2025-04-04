---
layout: post
title: Docker Tutorial
date: 2025-01-10 00:00:00
description: Notes on Docker
tags: data_engineering infra docker
categories: learning

toc:
  beginning: true
---

# Tutorial Source

[TechWorld with Nane - Docker Tutorial for Beginners [FULL COURSE in 3 Hours]](https://www.youtube.com/watch?v=3c-iBn73dDE)

# Common commands

Below are some of the common commands that you'll use for Docker.

## Get artefacts/images

To find the images, you may go to [Docker Hub](https://hub.docker.com/_/postgres) and search for the relevant images.

To get the latest image may run the following command

```docker
docker pull postgres
```

If you wish to get a specific version you may add a tag at the back, e.g. version 10.10

```docker
docker pull postgres:10.10
```

## Run images

### Attached mode

To run the image simply run the following command

```docker
docker run postgres:10.10
```

If the image was not pulled earlier, Docker will pull and run the image afterwards. However this will run in attached mode and the terminal needs to maintain in this state.
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/1.png" class="img-fluid rounded z-depth-1" %}

> 💡 By using Ctrl + C, this will stop the container

<br>

### Running in Detach mode

To run the container in detach mode, run the following command

```
docker run -d postgress:10.10
```

### Port forwarding/binding

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/2.png" class="img-fluid rounded z-depth-1" %}

Sometimes if we require to run more than 1 application in the same host machine, they might conflict with using the same port. To solve this, we will need to change the port of the local machine to point to as shown in the example.

> 💡 Container ports can be the same as they are the image ports. But as long as the host machine ports are not used twice then it is ok.

To port forward, we may use the following command

```
# docker run -p<HOST PORT>:<IMAGE PORT> -d postgres:10.10
docker run -p3000:5432 -d postgres:10.10
```

where `3000` is the port in the host binding to container’s `5432`

Example of running 2 images via different host ports:
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/3.png" class="img-fluid rounded z-depth-1" %}

## Naming containers upon run

Docker Names are randomly assigned. If you wish to name the container for easier reference you may run the following command

```
#docker run -p<HOST PORT>:<IMAGE PORT> --name <NAME> -d <IMAGE>:<TAG>
docker run -p3000:5432 --name pg_abc -d postgres:10.10
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/4.png" class="img-fluid rounded z-depth-1" %}

## Running with environmental variables

Some images may use environmental variables in order to run. E.g. [Mongo DB](https://hub.docker.com/_/mongo).

```
# use -e with the key-value pair for the environment variables
docker run -p 27017:27017 -d --name some-mongo \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=password \
    mongo
```

## Mounting volume for persistence of data in containers

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/5.png" class="img-fluid rounded z-depth-1" %}

### Types of Volumes

1. Host Volumes
   {% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/6.png" class="img-fluid rounded z-depth-1" %}
2. Anonymous Volumes
   {% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/7.png" class="img-fluid rounded z-depth-1" %}
3. Named Volumes
   {% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/8.png" class="img-fluid rounded z-depth-1" %}

## Stop containers

You may stop the running containers using the following command

```docker
# docker stop <CONTAINER ID>
docker stop fe8836ce13cb
```

## Start containers

Likewise, you may start a container using the following command

```docker
# docker start <CONTAINER ID>
docker start fe8836ce13cb
```

The container will still maintain the same attribute at time of creation in the `docker run` step.

## List containers

### List running containers

You may view running containers using the following command

```docker
docker ps
```

This will only show you currently running containers.

### List Running and stopped containers

If you have stopped containers previously, use the following command to see all running and stopped containers.

```docker
docker ps -a
```

# Docker Network

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/9.png" class="img-fluid rounded z-depth-1" %}
We package images into a network so that containers are able to find and talk to each other.

## List docker networks

To see the available docker networks we use the following command

```docker
docker network ls
```

## Create docker network

```docker
# docker network create <NETORK NAME>
docker network create mongo-network
```

## Running containers in the same network

```docker
# use --network <NETWORK NAME> to run the container in the network
docker run -d \
-p 27017:27017 \
--network mongo-network \
--name mongodb \
-e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=password \
mongo

docker run -d \
-p 8081:8081 \
-e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
-e ME_CONFIG_MONGODB_ADMINPASSWORD=password \
-e ME_CONFIG_MONGODB_SERVER=mongodb \
--network mongo-network \
--name mongo-express \
mongo-express
```

# Docker Compose

Instead of always running multiple run commands, we can combine them into a yaml file.

```yaml
version: '1'
services:
  my-app:
    image: ${docker-registry}/my-app:1.0 # <IMAGE : From Private Repo>
    ports:
      - 3000:3000

	mongodb: # <CONTAINER NAME>
    image: mongo # <IMAGE : Default is from Public Docker Hub>
    ports:
      - 27017:27017 # <HOST:CONTAINER>
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      #<REFERENCE NAME:CONTAINER DIRECTORY>
      - mongo-data:/data/db

  mongo-express: # <CONTAINER NAME>
    image: mongo-express # <IMAGE : Default is from Public Docker Hub>
    restart: always # fixes MongoNetworkError when mongodb is not ready when mongo-express starts
    ports:
      - 8080:8081 # <HOST:CONTAINER>
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=admin
      - ME_CONFIG_MONGODB_ADMINPASSWORD=password
      - ME_CONFIG_MONGODB_SERVER=mongodb

volumes:
  mongo-data: # <volume from mongodb>
    driver: local # <additional info for docker to create a physical storage locally>
```

> 💡 Do not need to specify network as containers in the same yaml file are in the same network.

## Start containers using docker-compose

```docker
# docker-compose -f <YAML_FILE>.yaml up
docker-compose -d -f mongo.yaml up
```

## Stop containers using docker-compose

```docker
# docker-compose -f <YAML_FILE>.yaml down
docker-compose -f mongo.yaml down
```

> 💡 This also removes the network

# Dockerfile

After developing and testing a app, it can be packaged into its own docker container for deployment. This image is built via a Dockerfile. This step is usually done at Jenkins side before pushing into the Docker Repository.
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-docker-notes/10.png" class="img-fluid rounded z-depth-1" %}

```docker
#FROM <IMAGE>
FROM node:13-alpine

# OPTIONAL BUT NOT RECOMMENDED
# It is better to set env externally at docker-compose instaed of rebuild image
# ENV MONGO_DB_USERNAME=admin \
#		MONGO_DB_PWD=password

# RUN allows to execute any Linux command
# Directory will be on container and not on host
# Can have multiple RUN commands
RUN mkdir -p /home/app

# <HOST SOURCE> <CONTAINER DEST>
COPY . /home/app

#CMD is an entrypoint command. Only 1 CMD
CMD ["node", "/home/app/server.js"]

```

## Building an image from Dockerfile

```docker
#docker build -t <IMAGE NAME>:<TAG> <LOCATION OF DOCKERFILE>
docker build -t my-app:1.0 .
```
