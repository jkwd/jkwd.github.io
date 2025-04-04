---
layout: post
title: Chess DE Project
date: 2025-04-03 00:00:00
description: Chess Dashboard Data Engineering Project using Dagster, DuckDB, dlt, dbt
tags: data_engineering ingestion transformation docker
categories: project

toc:
  beginning: true
---

# Introduction

This is a data engineering project that ingests data from Chess.com API into DuckDB, transforms the data using dbt on DuckDB and visualising the results on a Streamlit dashboard.

## Architecture

The data engineering project stack contains the following:

1. [dltHub](https://dlthub.com/): Ingestion Layer to load the data into the data warehouse
2. [Dagster](https://dagster.io/): To schedule and orchestrate the DAGs
3. [Postgres](https://www.postgresql.org/): To store and persist Dagster details
4. [DuckDB](https://duckdb.org/): Data Warehouse
5. [Streamlit](https://streamlit.io/): Dashboard Layer

## Architecture Diagram

{% include figure.liquid loading="eager" path="assets/img/2025-04-03-chess-de-project/1.png" class="img-fluid rounded z-depth-1" %}

## Project Structure

```
.
├── chess_dagster
│   ├── chess_dbt
│   ├──   ├── dbt_project.yml
│   ├──   ├── models/
│   ├──   ├── tests/
│   ├──   ├── udf/
│   ├──   ├── ...
│   ├── chess_dlt
│   ├──   ├── .dlt/
│   ├──   ├── __init__.py
│   ├──   ├── data_contracts.py
│   ├── chess_etl
│   ├──   ├── assets_dbt.py
│   ├──   ├── assets_dlt.py
│   ├──   ├── definitions.py
│   ├──   ├── resources.py
│   ├── dagster.yaml
│   ├── Dockerfile_dagster
│   ├── Dockerfile_user_code
│   ├── profiles.yml
│   ├── pyproject.toml
│   ├── workspace.yaml
├── data
│   ├── chess.duckdb
│   ├── ...
├── streamlit_dashboard
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── .env.example
├── docker-compose-dashboard.yml
├── docker-compose.yml
├── Makefile
└── README.md
```

## Running Chess Dashboard

### Run locally

To run locally, you'll need:

1. [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
2. [Github account](https://github.com/)
3. [Docker](https://docs.docker.com/engine/install/)
4. [Docker Compose](https://docs.docker.com/compose/install/)

Clone the repo, create a `.env` file and run the following commands to start the data pipeline:

1. `git clone https://github.com/jkwd/chess_dashboard.git`
2. `cd chess_dashboard`
3. `make init` to create an `.env` file from `.env.example`
4. Edit the `CHESS_USERNAME` in the `.env` file to your username
5. `make up` to build and start the docker container
6. Go to `http://localhost:3000` to view the Dagster UI
7. [Materialize all assets](#running-dagster-job)
8. Go to `http://localhost:8501` to view the Streamlit Dashboard
9. `make down` to stop the containers

### Github Codespaces

1. Fork/Clone `https://github.com/jkwd/chess_dashboard.git` to your own Repository
2. Open in Codespaces
3. `make init` to create an `.env` file from `.env.example`
4. Edit the `CHESS_USERNAME` in the `.env` file to your username
5. `make up` to build and start the docker container
6. Find the forwarded addresses in `PORTS` section of the Code Editor
   {% include figure.liquid loading="eager" path="assets/img/2025-04-03-chess-de-project/2.png" class="img-fluid rounded z-depth-1" %}
7. Go to Forwarded address for port `3000` to view the Dagster UI
8. [Materialize all assets](#running-dagster-job)
9. Go to Forwarded address for port `8501` to view the Streamlit Dashboard
10. `make down` to stop the containers
11. Stop/Delete Codespaces when you are done

### Running Dagster Job

Click on Assets Tab on the top
{% include figure.liquid loading="eager" path="assets/img/2025-04-03-chess-de-project/3.png" class="img-fluid rounded z-depth-1" %}

Click on View global asset ineage at the top right of the page
{% include figure.liquid loading="eager" path="assets/img/2025-04-03-chess-de-project/4.png" class="img-fluid rounded z-depth-1" %}

Click on Materialize All

# Implementation

## Dagster as an Orchestrator

Taking it directly from the docs, Dagster is an open source data orchestrator built for data engineers, with integrated lineage, observability, a declarative programming model, and best-in-class testability.

There are many components to Dagster, but for this project we mainly focus on the following:

1. Asset: The logical unit of data, e.g. table, dataset, ML model. This forms the nodes in the lineage graph. In this project, the assets are the dlt asset and the dbt asset.
2. Resource: External dependencies such as APIs, databases, or anything outside of Dagster. In this project, the resources are DuckDB, dlt and dbt.
3. Jobs: A subset of Assets. E.g. `some_job_1` can contain assets `A, B, C` and `some_job_2` can contain assets `W, X, Y, Z`.
4. Schedule: A way to automate jobs/assets at a given interval (e.g. run everyday at 0000 UTC)
5. Definitions: The top-level construct of the Dagster project which contains references to all the objects, e.g. Asset, Resources, Schedules, Jobs, etc.

## DuckDB as the Data Warehouse

In simple terms, DuckDB is the online analytical processing (OLAP) version of SQLite. It is easy to install with a `pip install duckdb` and its completely embedded within the host system. It is free, fast, portable and has lots of features. It is simple and perfect for a single-node project like this.

## Ingestion using dlt+dagster

[dlt](https://dlthub.com/) allows us to load data from source system to a destination system using python.

There are 4 main components to dlt:

1. [Source](https://dlthub.com/docs/general-usage/source): The group of resources we plan to get the data from. E.g. API endpoint or Postgres DB
2. [Resource](https://dlthub.com/docs/general-usage/resource): A function that yields the data
3. [Destination](https://dlthub.com/docs/general-usage/destination): The location we want the data to land. E.g. S3, Snowflake, DuckDB
4. [Pipeline](https://dlthub.com/docs/reference/explainers/how-dlt-works): The main building block of dlt which orchestrates the loading of data from your source into your destination in three discrete steps
   1. Extracts data from the source to the hard drive
   2. Inspects and normalizes your data and computes a schema compatible with your destination. E.g. `{"items": {"id": 1}}` will become `items__id`. You can control the normalization phase and apply data schema contracts.
   3. Loads the data into the destination and run schema migrations if necessary

### Configuring the Source

A source can consist of a group of resources. So let's start with the resource first:

```python
# chess_dagster/chess_dlt/__init__.py

@dlt.resource(write_disposition="replace", columns=PlayersGames)
def player_games(username: str) -> Generator[Any, Any, Any]:
    """
    Yields player's `username` games.
    Args:
        username: str: Player username to retrieve games for.
    Yields:
        Generator[Any, Any, Any]: A generator that return a list of games for a player.
    """

    def _get_player_archives(username: str) -> List:
        """
        Returns url to game archives for a specified player username.
        Args:
            username: str: Player username to retrieve archives for.
        Yields:
            List: List of player archive data.
        """

        data = requests.get(f"https://api.chess.com/pub/player/{username}/games/archives")
        return data.json().get("archives", [])

    # get archives in parallel by decorating the http request with defer
    @dlt.defer
    def _get_games(url: str) -> List[Dict[str, Any]]:
        """
        Returns games of the specified player username from the given archive url.
        Args:
            url: str: URL to the archive to retrieve games from in the format https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}
        Yields:
            List: List of player's games data.
        """
        logger.info(f"Getting games from {url}")
        try:
            games = requests.get(url).json().get("games", [])
            return games  # type: ignore

        except requests.HTTPError as http_err:
            # sometimes archives are not available and the error seems to be permanent
            if http_err.response.status_code == 404:
                return []
            raise
        except Exception as err:
            logger.error(f"Unexpected error: {err}")
            raise


    archives = _get_player_archives(username)
    for url in archives:
        # the `url` format is https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}

        # get the filtered archive
        yield _get_games(url)
```

Here we have 1 resource `player_games` which gets the games of the player.

Where we have configured 2 things:

1. `write_disposition="replace"`: This means that every time we get new data, we will replace the entire table.
2. `columns=PlayersGames`: This is where we apply a data schema contract during using [Pydantic](https://docs.pydantic.dev/latest/) the normalize phase of the pipeline to ensure that the API returns the columns that we expect and in the right data type.

Once we have the resource data, we can plug it into the source as such:

```python
# chess_dagster/chess_dlt/__init__.py

@dlt.source(name="chess")
def source(username: str):
    return (
        player_games(username=username)
    )
```

As mentioned earlier, a `dlt.source` consist of a group or resources. So if there is another resource then we just need to add it into the return statement tuple.

The dagster asset created from the source and resource will have the name of `dlt_<source_def_name>_<resource_def_name>`. So in the case of the project it will be identified as `dlt_source_player_games`. If you remember when configuring `@dlt.source(name="chess")` we have the additional `name` parameter, this overwrites the source function name. So it will finally resolve to `dlt_chess_player_games` to be referenced by other downstream assets.

Now that we have the source and resources done, let's integrate dlt with dagster.

### Integrating dlt with dagster

You can follow this [guide](https://docs.dagster.io/integrations/embedded-elt/dlt) to integrate dagster+dlt.

This requires:

1. Creating the dagster resource for dlt (Not to be confused with dlt resource)
2. Creating of the dlt asset
3. Setting the dlt asset and dagster resource for dlt into the dagster definition

```python
# chess_dagster/chess_etl/resources.py

from dagster_embedded_elt.dlt import DagsterDltResource

dlt_resource = DagsterDltResource()
```

Configuring the dagster resource for dlt is as simple as the 2 lines above. This resource will then be used in the Dagster definition. We will come back to the Dagster definition in the later section after configuring the dbt asset and resources as well.

```python
# chess_dagster/chess_etl/assets_dlt.py

@dlt_assets(
    dlt_source=source(
        username=os.getenv("CHESS_USERNAME")
    ),
    dlt_pipeline=pipeline(
        pipeline_name="chess_pipeline",
        destination=destinations.duckdb(os.getenv('CHESS_DB')), # The path to the .duckdb file
        dataset_name=SCHEMA_RAW, # This is the table schema in duckdb.
    ),
    name="chess", # This is the table catalog in duckdb.
)
def chess_dlt_assets(context: AssetExecutionContext, dlt: DagsterDltResource):
    yield from dlt.run(context=context)
```

The above code creates the dlt asset. dlt allow us to just focus on getting the data into the required format. If you noticed, the creation and insert/overwrite/deletion of schema and table are all handled by dlt.

In DuckDB, the table details will be as follows when the data has been loaded given that `SCHEMA_RAW='chess_data_raw'`:

| table_catalog | table_schema   | table_name   |
| ------------- | -------------- | ------------ |
| chess         | chess_data_raw | player_games |

## Transformation using dbt+dagster

[dbt](https://docs.getdbt.com/docs/introduction) is a transformation workflow that allows you to modularize and centralize your analytics code, while also providing your data team with guardrails typically found in software engineering workflows. It allows engineers to transform data in the warehouse more effectively and its the T in the ELT framework.

There are many components to dbt, but for this project we mainly focus on the following:

1. Models: SQL/python queries that define data transformations
2. Tests: Ensure data quality by validating on the models
3. Documentation: Documentation of the table and columns as well as providing the data lineage

### Configuring the dbt project

```yaml
{% raw %}
# dbt_project.yml

name: 'chess_dbt'
version: '1.0.0'

profile: 'chess_dbt'

model-paths: ["models"]
seed-paths: ["seeds"]
test-paths: ["tests"]
analysis-paths: ["analysis"]
macro-paths: ["macros"]

target-path: "target"
clean-targets:
    - "target"
    - "dbt_modules"
    - "logs"

require-dbt-version: [">=1.0.0", "<2.0.0"]

vars:
  username: "{{env_var('CHESS_USERNAME')}}"


models:
  chess_dbt:
    materialized: table
    staging:
      materialized: view
{% endraw %}
```

```yaml
{% raw %}
# profiles.yml

chess_dbt:
  target: dev
  outputs:
    dev:
        ...
    ci:
        ...
    prod:
      type: duckdb
      path: "{{ env_var('CHESS_DB') }}"
      threads: 1
      module_paths:
        - "{{ env_var('DAGSTER_APP') }}/chess_dbt/udf"
      plugins:
        # Custom module in the lib directory that defines SQL UDFs written in Python at the start of
        # the dbt run
        - module: my_custom_functions
{% endraw %}
```

Above are the configurations for the `dbt_project.yml` and `profiles.yml`.

### Using python UDFs

In the `profiles.yml` you may notice something less familiar under the `module_paths` and `plugins`. DuckDB allows us to register Python UDFs which can then be used as a function in our SQL models. So we create the UDF in `my_custom_functions.py` file located at the specified module_paths.

```python
# chess_dagster/chess_dbt/udf/my_custom_functions.py

from duckdb import DuckDBPyConnection

from dbt.adapters.duckdb.plugins import BasePlugin
from dbt.adapters.duckdb.utils import TargetConfig

import chess.pgn
from io import StringIO
import chess

def pgn_to_fens_udf(pgn: str) -> list[str]:
    """Takes in a PGN and go move by move to get the FEN of the board at each move.
    Returns a list of fen strings.

    Args:
        pgn (str): pgn of the game

    Returns:
        arr (list[str]): fen strings of the board at each move
    """
    pgn_header = pgn.split('\n\n')[0]
    pgn_moves = pgn.split('\n\n')[1]
    if 'Chess960' not in pgn_header:
        pgn = pgn_moves

    arr = []
    game = chess.pgn.read_game(StringIO(pgn)).game()
    board = game.board()

    for move in game.mainline_moves():
        board.push(move)
        fen = board.fen()
        arr.append(fen)

    return arr

# The python module that you create must have a class named "Plugin"
# which extends the `dbt.adapters.duckdb.plugins.BasePlugin` class.
class Plugin(BasePlugin):
    def configure_connection(self, conn: DuckDBPyConnection):
        conn.create_function("pgn_to_fens_udf", pgn_to_fens_udf)
```

Above is an example of how we can configure the the UDF and in the SQL model, we can do something like below to use it:

```sql
select
pgn_to_fens_udf('some_pgn') as fens
from some_table
```

Technically, dbt has released python models which would have allowed us to just create the model in python instead of using UDF with SQL. However by doing this, we may restrict ourselves unintentionally. As dbt is a more SQL-first framework, some features such as dbt unit-tests are only [supported with SQL models](https://docs.getdbt.com/docs/build/unit-tests#before-you-begin).

### Integrating dbt with dagster

You can follow this [guide](https://docs.dagster.io/integrations/libraries/dbt/dbt-core) to integrate dagster+dbt.

This requires:

1. Creating the dagster resource for dbt
2. Creating of the dbt asset in Dagster
3. Setting the dbt asset and dagster resource for dbt into the dagster definition

```python
# chess_dagster/chess_etl/resources.py

from dagster_dbt import DbtCliResource
from pathlib import Path
import os

HOME_DIR = os.getenv("HOME")

dbt_project_dir = Path(__file__).joinpath("..", "..", "chess_dbt").resolve()
dbt_resource = DbtCliResource(project_dir=os.fspath(dbt_project_dir),
                              profiles_dir=os.path.join(HOME_DIR, ".dbt"),
                              global_config_flags=["--log-format-file", "text"],
                              target="prod")

# If DAGSTER_DBT_PARSE_PROJECT_ON_LOAD is set, a manifest will be created at run time.
# Otherwise, we expect a manifest to be present in the project's target directory.
if os.getenv("DAGSTER_DBT_PARSE_PROJECT_ON_LOAD"):
    dbt_manifest_path = (
        dbt_resource.cli(
            ["--quiet", "parse"],
            target_path=Path("target"),
        )
        .wait()
        .target_path.joinpath("manifest.json")
    )
else:
    dbt_manifest_path = dbt_project_dir.joinpath("target", "manifest.json")
```

Setting up the dbt resources is not as straightforward as dlt's. Like any other dbt projects, we may need to specify the path to the `dbt_project.yml` and `profiles.yml`.

In addition to the 2 files, Dagster also expects the dbt `manifest.json` to be present. The manifest contains all the dbt model, tests, macros, etc and it'll be used by Dagster to create the respective Dagster Assets and also display them on the lineage graph in the UI. We have `DAGSTER_DBT_PARSE_PROJECT_ON_LOAD` in our `.env` file to give us the flexibility to provide our own manifest file or to parse one at "runtime".

```python
# chess_dagster/chess_etl/assets_dbt.py

from dagster import AssetExecutionContext
from dagster_dbt import DbtCliResource, dbt_assets

from chess_etl.resources import dbt_manifest_path


@dbt_assets(manifest=dbt_manifest_path)
def chess_dbt_assets(context: AssetExecutionContext, dbt: DbtCliResource):
    yield from dbt.cli(["build", "--target", "prod"], context=context).stream()
```

Using the `manifest.json` and the `DbtCliResource`, we can now define our Dagster dbt asset. We can specify the dbt command that we want in `dbt.cli()`.

## Dagster definitions to integrate dlt+dbt into Dagster

```python
# chess_dagster/chess_etl/definitions.py

from dagster import (
    Definitions,
    ScheduleDefinition,
    define_asset_job,
)
from chess_etl.assets_dlt import chess_dlt_assets
from chess_etl.assets_dbt import chess_dbt_assets
from chess_etl.resources import dlt_resource, dbt_resource


all_assets_job = define_asset_job(name="all_assets_job")

daily_refresh_schedule = ScheduleDefinition(
    job=all_assets_job, cron_schedule="0 0 * * *"
)

# Must be last
defs = Definitions(
    assets=[chess_dlt_assets, chess_dbt_assets],
    resources={
        "dlt": dlt_resource,
        "dbt": dbt_resource,
    },
    schedules=[daily_refresh_schedule],
    jobs=[all_assets_job]
)
```

In the definitions, we will define the 2 resources and assets. We can also create a Job and Schedule for that Job. Everything will be part of the `Definitions()` that will be used to power the Dagster app.

## Deploying Dagster on Docker

You can follow this [guide](https://docs.dagster.io/guides/deploy/deployment-options/docker) and this [github](https://github.com/dagster-io/dagster/tree/master/examples/deploy_docker) to deploy the project on Dagster

{% include figure.liquid loading="eager" path="assets/img/2025-04-03-chess-de-project/5.png" class="img-fluid rounded z-depth-1" %}

Dagster allows us to seperate the user code from the system code. This allows for seperation of concerns and any crashes from the user code will not crash Dagster. Each user code repository and the Dagster system can run on their own python environment as well which reduces the dependencies of each other.

You may view the following code in the links provided to set up Dagster on Docker:

- [Dockerfile_dagster](https://github.com/jkwd/chess_dashboard/blob/main/chess_dagster/Dockerfile_dagster)
- [Dockerfile_user_code](https://github.com/jkwd/chess_dashboard/blob/main/chess_dagster/Dockerfile_user_code)
- [docker-compose.yml](https://github.com/jkwd/chess_dashboard/blob/main/docker-compose.yml)
- [workspace.yaml](https://github.com/jkwd/chess_dashboard/blob/main/chess_dagster/workspace.yaml)
- [dagster.yaml](https://github.com/jkwd/chess_dashboard/blob/main/chess_dagster/dagster.yaml)

## Streamlit Dashboard

Once the data has been populated, we can view the results in the streamlit dashboard under `http://localhost:8501/`.

## CI Checks

```yaml
{% raw %}
name: Docker CI Workflow

on:
  workflow_dispatch:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  run-ci-tests:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Create .env file
      run: cp .env.example .env

    - name: Check docker-compose
      run: docker compose version

    - name: Check docker-compose format
      run: docker compose -f docker-compose.yml config

    - name: Install Make
      run: sudo apt-get install make

    - name: Build the docker compose images
      run: make build

    - name: Run python lint
      run: make lint-python

    - name: Run SQL lint
      run: make lint-sql

    - name: Run pytest
      run: make pytest

    - name: Run dbt unit test
      run: make dbt-unit-test

    - name: Run e2e
      run: make run

  generate-dbt-docs:
    runs-on: ubuntu-latest
    needs: run-ci-tests

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: print working directory
        run: pwd

      - name: list directory
        run: ls -l

      - name: Install dbt
        run: pip3 install dbt-duckdb==1.9.0

      - name: Verify dbt
        run: dbt --version

      - name: dbt parse
        working-directory: ./chess_dagster/chess_dbt
        env:
          CHESS_USERNAME: magnuscarlsen
        run : |
          dbt parse --profiles-dir .. --project-dir . --target ci

      - name: generate dbt docs
        working-directory: ./chess_dagster/chess_dbt
        env:
          CHESS_USERNAME: magnuscarlsen
        run : |
          dbt docs generate --profiles-dir .. --project-dir . --empty-catalog --no-compile --target ci
          cd target
          mkdir ${{ github.workspace }}/docs
          cp *.json *.html ${{ github.workspace }}/docs
          ls -ltra ${{ github.workspace }}/docs

      - name: "Upload pages to artifact"
        uses: actions/upload-pages-artifact@v3
        with:
          path: ${{ github.workspace }}/docs

      - name: "Zip artifact"
        run: zip -jrq docs.zip ${{ github.workspace }}/docs

      - name: "Upload artifact for deployment job"
        uses: actions/upload-artifact@v4
        with:
          name: docs
          path: docs.zip

  # Deploy to Github pages
  deploy-to-github-pages:
    # Add a dependency to the build job
    needs: generate-dbt-docs

    # Grant GITHUB_TOKEN the permissions required to make a Pages deployment
    permissions:
      pages: write # to deploy to Pages
      id-token: write # to verify the deployment originates from an appropriate source

    # Deploy to the github-pages environment
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    # Specify runner + deployment step
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4 # or the latest "vX.X.X" version tag for this action
{% endraw %}
```

For CI, we use Github Actions to perform the checks and publish dbt docs for reference:

1. Lint python using ruff
2. Lint SQL using sqlruff
3. Run pytests for python based unit tests
4. Run dbt unit tests
5. Run Dagster Job end-to-end to ensure everything works (Job is relatively fast)
6. Generate dbt docs
7. Publish dbt docs to github pages (You can view the generated dbt docs [here](https://johnkohwd.com/chess_dashboard))

Step 1-5 are being run on the docker container to ensure consistency in the results.
