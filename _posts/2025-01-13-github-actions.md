---
layout: post
title: Github Actions Tutorial
date: 2025-01-10 00:00:00
description: Notes on Github Actions
tags: data_engineering github_actions cicd
categories: learning

toc:
  beginning: true
---

# Example

```yaml
name: Deploy Workflow
on:
  workflow_dispatch:
  pull_request:
    types:
      - opened
      - edited
    branches:
      - main
      - 'dev-*' # * allows anything other then '/' E.g. dev-new dev-another
      - 'feat/**' #** allows for more '/'. E.g. feat/new #feat/new/button
  push:
    branches:
      - main
      - 'dev-*' # * allows anything other then '/' E.g. dev-new dev-another
      - 'feat/**' #** allows for more '/'. E.g. feat/new #feat/new/button
    paths-ignore:
      - '.github/workflows/*'
env:
  WORKFLOW_ENV_1: gha-demo # Workflow level
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Lint code
        run: npm run lint
  test:
    # Job level environment
    env:
      JOB_ENV_1:
      JOB_ENV_1:
      JOB_ENV_1:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Test code
        id: run-tests
        run: npm run test
      - name: Upload test report
        if: failure() && steps.run-tests.outcome == 'failure'
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test.json
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      script-file: ${{ steps.publish.outputs.script }}
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Build website
        run: npm run build
      - name: Publish JS filename
        id: publish
        run: find dist/assets/*.js -type f -execdir echo 'script={}' >> $GITHUB_OUTPUT ';'
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-files
      - name: Output contents
        run: ls
      - name: Output filename
        run: echo "${{ needs.build.outputs.script-file }}"
      - name: Deploy
        run: echo "Deploying..."
  report:
    needs: [lint, deploy] # To force the report job to run last
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Output info
        run: |
          echo "something went wrong..."
          echo "${{ toJSON(github) }}"
```

> 💡 YML file needs to be stored in `.github/workflows` directory

# Workflow

- Requires the `name` of the workflow
- Requires the `on` to listen to events to trigger the workflow

## Event Listeners

- `workflow_dispatch`
  - manual trigger
- `pull_request`
  - requires types - has some default types if not specified
  - Allows for branches/path targetted
- `push`
  - Allows for branches/path targetted

> 💡 branches and paths have the compliment version (e.g. branch-ignore/path-ignore).
> Event Listeners operate on an OR condition within the branch/path and AND condition betwenn branch/path

# Jobs

```yaml
jobs:
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Build website
        run: npm run build
```

- Requres the `runs-on` to specify the type of machine the steps will run on
- `needs` is used to specify the upstream job dependency (e.g. `build` job depends on `test`)

## Steps

```yaml
steps:
  - name: Get code
    uses: actions/checkout@v3

  - name: Install NodeJS
    uses: actions/setup-node@v3
    with:
      node-version: 18

  - name: Install dependencies
    run: npm ci
```

- `run` - anything eg bash commands etc
- `uses`- uses existing github actions packages to help
  - `with`- additional parameters to be used with the actions package

# Skip Workflow

- `git commit -m "Add comment [skip ci]"`
  - To not make workflow run for this particular push

# Job Artifacts & Outputs

## Artifacts

### Upload artifacts

- Output from the workflow, e.g. log files or app binaries from build

```yaml
steps:
  - name: Get code
    uses: actions/checkout@v3
  - name: Install dependencies
    run: npm ci
  - name: Build website
    run: npm run build
  - name: Upload artifacts
    uses: actions/upload-artifact@v3
    with:
      name: dist-files
      path: |
        dist
        package.json
```

- Artifacts shown in github actions workflow
  - Contains both dist and package.json as specified above

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/1.png" class="img-fluid rounded z-depth-1" %}

<div class="col-sm-6 mx-auto">
{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/2.png" class="img-fluid rounded z-depth-1" %}
</div>

### Downloading artifacts

```yaml
steps:
  - name: Get build artifacts
    uses: actions/download-artifact@v3
    with:
      name: dist-files
  - name: Output contents
    run: ls
```

- Files are already unpacked
  {% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/3.png" class="img-fluid rounded z-depth-1" %}

## Job Outputs

- Different from artifacts
  - Typically used for reusing value in downstream jobs (e.g. name of file)

```yaml
build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      script-file: ${{ steps.publish.outputs.script }}
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Build website
        run: npm run build
      - name: Publish JS filename
        id: publish
        run: find dist/assets/*.js -type f -execdir echo 'script={}' >> $GITHUB_OUTPUT ';'
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-files
      - name: Output contents
        run: ls
      - name: Output filename
        run: echo "${{ needs.build.outputs.script-file }}"
      - name: Deploy
        run: echo "Deploying..."
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/4.png" class="img-fluid rounded z-depth-1" %}

<div class="col-sm-9 mx-auto">
{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/5.png" class="img-fluid rounded z-depth-1" %}
</div>

# Dependency Caching

- Cache repeated steps to reduce time of workflow
  {% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/6.png" class="img-fluid rounded z-depth-1" %}

https://github.com/actions/cache/blob/main/examples.md#node---npm

- Looks for the file hash of the dependency installation details (In js is package-lock.json)
  - To be used in all the repeated palces with the same `key`

```yaml
test:
  # Do something above
  - name: Cache dependencies
    uses: actions/cache@v3
    with:
      path: ~/.npm
      key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
  - name: Install dependencies
    run: npm ci
  - ...
build:
  # Do something above
  - name: Cache dependencies
    uses: actions/cache@v3
    with:
      path: ~/.npm
      key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
  - name: Install dependencies
    run: npm ci
  - ...
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/7.png" class="img-fluid rounded z-depth-1" %}
{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/8.png" class="img-fluid rounded z-depth-1" %}

# Environment Variables

```yaml
name: Deployment
on:
  push:
    branches:
      - main
      - dev
env:
  MONGODB_DB_NAME: gha-demo # Workflow level ENV_VAR
jobs:
  test:
    # Job level ENV_VAR
    env:
      MONGODB_CLUSTER_ADDRESS: cluster_1.mongodb.net
      MONGODB_USERNAME: admin
      MONGODB_PASSWORD: admin
      PORT: 8080
    runs-on: ubuntu-latest
    steps:
      # Do something above
      # Reference the job level env var PORT
      - name: Run server
        run: npm start & npx wait-on http://127.0.0.1:$PORT
  deploy:
    # Previous Job ENV_VARs not accessible
```

# Secrets

## Repository Secrets

- To prevent pushing username/passwords into the `.github/workflows/` code
  - Create via Repository secrets

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/9.png" class="img-fluid rounded z-depth-1" %}

```yaml
name: Deployment
on:
  push:
    branches:
      - main
      - dev
env:
  MONGODB_DB_NAME: gha-demo # Workflow level ENV_VAR
jobs:
  test:
    # Job level ENV_VAR
    env:
      MONGODB_CLUSTER_ADDRESS: cluster_1.mongodb.net
      MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
      MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
      PORT: 8080
    runs-on: ubuntu-latest
    steps:
      # Do something above
      # Reference the job level env var PORT
      - name: Run server
        run: npm start & npx wait-on http://127.0.0.1:$PORT
  deploy:
    # Previous Job ENV_VARs not accessible
```

> 💡 When echo the environment variable with secrets, it’ll hide the info and print `***`

## Environment Secrets

- Allow you to have different secret values for different environment
  - Testing
  - Production
- Allows secrets to be used on certain branch/tag logic

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/10.png" class="img-fluid rounded z-depth-1" %}
{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/11.png" class="img-fluid rounded z-depth-1" %}

```yaml
name: Deployment
on:
  push:
    branches:
      - main
      - dev
env:
  MONGODB_DB_NAME: gha-demo # Workflow level ENV_VAR
jobs:
  test:
    environment: testing # To use the environment secrets named 'testing'
    # Job level ENV_VAR
    env:
      MONGODB_CLUSTER_ADDRESS: cluster_1.mongodb.net
      MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
      MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
      PORT: 8080
    runs-on: ubuntu-latest
    steps:
      # Do something above
      # Reference the job level env var PORT
      - name: Run server
        run: npm start & npx wait-on http://127.0.0.1:$PORT
  deploy:
    # Previous Job ENV_VARs not accessible
```

# Execution flow

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/12.png" class="img-fluid rounded z-depth-1" %}

## Step level if condition

### Failure example

```yaml
- name: Test code
  id: run-tests
  run: npm run test
- name: Upload test report
  if: failure() && steps.run-tests.outcome == 'failure'
  uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: test.json
```

> 💡 `failure()` is required in order to run the Upload test report step

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/13.png" class="img-fluid rounded z-depth-1" %}

### Cache example

If node_modules exist then do not need to install dependencies

```yaml
- name: Cache dependencies
  id: cache
  uses: actions/cache@v3
  with:
    path: node_modules
    key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: npm ci
```

## Job level if condition

```yaml
report:
  needs: [lint, deploy] # To force the report job to run last
  if: failure()
  runs-on: ubuntu-latest
  steps:
    - name: Output info
      run: |
        echo "something went wrong..."
        echo "${{ toJSON(github) }}"
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/14.png" class="img-fluid rounded z-depth-1" %}

# Matrix strategy

- Allows to run same job with multiple different configurations

```yaml
name: Matrix Demo
on:
  push:
    branches:
      - main

jobs:
  lint:
    continue-on-erro: true # To let the rest of the jobs run if 1 fails
    strategy:
      matrix:
        # Create 3 x 2 combinations
        node-version: [12, 14, 16]
        operating-system: [ubuntu-latest, windows-latest]
        # Exclude combination in the matrix
        exclude:
          - node-version: 12
            operating-system: windows-latest
        # Add single combination not part of matrix
        include:
          - node-version: 18
            operating-system: ubuntu-latest
    runs-on: ${{ matrix.operating-system }}
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Install NodeJS
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Lint code
        run: npm run lint
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/15.png" class="img-fluid rounded z-depth-1" %}

# Reusable workflow

- Create a workflow that can be referenced and used from another workflow
  - Allows inputs to make it dynamic
  - Allows passing info back to the wofkflow calling it

```yaml
name: Reusable Deploy
on:
  workflow_call: # Allows this workflow to be called from other workflow
    inputs:
      artifact-name:
        description: The name of the deployable artifact file
        required: false
        default: dist
        type: string
    outputs:
      result:
        description: Result of the deployment operation
        value: ${{ jobs.deploy.outputs.outcome }}
    secrets:
      some-secret:
        required: false
jobs:
  deploy:
    outputs:
      outcome: ${{ steps.set-result.outputs.step-result }}
    runs-on: ubuntu-latest
    steps:
      - name: Get Code Binaries
        uses: actions/download-artifact@v3
        with:
          name: ${{ inputs.artifact-name }}
      - name: List files
        run: ls
      - name: Output info
        run: echo "Deploying..."
      - name: Set result output
        id: set-result
        run: echo "step-result=success" >> $GITHUB_OUTPUT
```

> 💡 on needs to be workflow_call

```yaml
name: Use Reusable
on:
  push:
    branches:
      - main
jobs:
  lint: ...
  test: ...
  build: ...
  deploy:
    needs: build
    uses: ./.github/workflows/reusable.yml # yml of the workflow to use
    with:
      artifact-name: dist-files # To pass the variable over to reusable.yml
    secrets:
      some-secret: ${{ secrets.some-secret }}
  print-deploy-result:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Print deploy output
        run: echo "${{ needs.deploy.outputs.result }}"
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/16.png" class="img-fluid rounded z-depth-1" %}

# Run Jobs on docker containers

```yaml
jobs:
  test:
    environment: testing
    runs-on: ubuntu-latest
    container: # DEFINE HERE. HOSTED ON ubuntu-latest
      image: node:16
      env: # THIS IS ENV_VAR FOR IMAGE AND NOT STEPS
        VAR_1: val_1
    env:
      MONGODB_CONNECTION_PROTOCOL: mongodb+srv
      MONGODB_CLUSTER_ADDRESS: cluster0.ntrwp.mongodb.net
      MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
      MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
      PORT: 8080
    steps:
      - ...
      - ...
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/17.png" class="img-fluid rounded z-depth-1" %}

## Service Containers

- To host a isolated testing db inside the github action job instead of connecting to the prod db

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/18.png" class="img-fluid rounded z-depth-1" %}

### Using Service with Container

- Create a mongodb service inside node:16 container with network name as mongodb-service

```yaml
jobs:
  test:
    environment: testing
    runs-on: ubuntu-latest
    container: # DEFINE HERE. HOSTED ON ubuntu-latest
      image: node:16
      env: # THIS IS ENV_VAR FOR IMAGE AND NOT STEPS
        VAR_1: VAL_1
    env:
      MONGODB_CONNECTION_PROTOCOL: mongodb
      MONGODB_CLUSTER_ADDRESS: mongodb-service
      MONGODB_USERNAME: root # Testing DB details
      MONGODB_PASSWORD: example
      PORT: 8080
    services: # ALWAYS RUN INSIDE OF IMAGES
      mongodb-service: # Testing DB - will be deleted after job ends
        image: mongo
        env:
          MONGO_INITDB_ROOT_USERNAME: root
          MONGO_INITDB_ROOT_PASSWORD: example
      another-service: ...
    steps:
      - ...
```

> 💡 If job runs in container, then github actions will handle the networking between the container and service for you. Hence in above example, `MONGODB_CLUSTER_ADDRESS` can be set to the name of the service `mongodb-service`

### Using Service without container

```yaml
jobs:
  test:
    environment: testing
    runs-on: ubuntu-latest
    env:
      MONGODB_CONNECTION_PROTOCOL: mongodb
      MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017
      MONGODB_USERNAME: root # Testing DB details
      MONGODB_PASSWORD: example
      PORT: 8080
    services: # ALWAYS RUN INSIDE OF IMAGES
      mongodb-service: # Testing DB - will be deleted after job ends
        image: mongo
        ports: # Need to open the mongodb port
          - 27017:27017
        env:
          MONGO_INITDB_ROOT_USERNAME: root
          MONGO_INITDB_ROOT_PASSWORD: example
      another-service: ...
    steps:
      - ...
```

> 💡 If no containers are used, then the service port will need to be opened and changing the `MONGODB_CLUSTER_ADDRESS`

# Custom Actions

- 3 kinds of custom actions

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/19.png" class="img-fluid rounded z-depth-1" %}

## Composite Actions

Stored in

1. New repository of actions
2. Locally within `.github/<folder_name>/<action_name>/action.yml`

### Example (Custom Composite Action)

```yaml
name: "Get & Cache Dependencies"
description: "Get the dependencies (via npm) and cache them."
inputs: # Custom input for the action
  to-cache:
    description: "Whether to cache dependencies or not"
    required: false
    default: "true"
outputs: # Custom output for the action
  used-cache:
    description: "Whether cache was used or not"
    value: ${{ steps.install-deps.outputs.cache-output }}

# runs and using are compulsory
runs:
  using: "composite"
  steps:
    - name: Cache dependencies
      if: inputs.to-cache == 'true'
      id: cache
      uses: actions/cache@v3
      with:
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      id: install-deps
      if: steps.cache.outputs.cache-hit != 'true' || inputs.to-cache != 'true'
      # shell required if using 'run' key
      run: |
        npm ci
        echo "cache-output=${{ inputs.to-cache }}" >> $GITHUB_OUTPUT
      shell: bash
```

### Example (Using custom Action at workflow yml)

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Load and cache dependencies
        id: cache-deps
        uses: ./.github/actions/cached-deps #gh-actions will look for action.yml
        with:
          to-cache: "false"
      - name: Output Information
        run: echo "Cached used? ${{ steps.cache-deps.outputs.used-cache }}"
      - name: Lint code
        run: npm run lint
```

## JavaScript Actions

- Contains action.yml and some_name.js within `.github/<folder_name>/<action_name>/` directory
- Requires addition npm libraries
  - `cd` to the directory where the action files are located
  - `npm init -y`
    - Requires nodeJS installed in your system
  - `npm install @actions/core @actions/github @actions/exec`

> 💡 Ensure all files in node_modules in the directory is not gitignored

### action.yml

```yaml
name: "Deploy to AWS S3"
description: "Deploy static website to AWS S3"
inputs:
  bucket:
    description: "S3 bucket name"
    required: true
  bucket-region:
    description: "S3 bucket region"
    required: false
    default: "ap-southeast-1"
  dist-folder:
    description: "Folder containing deployable files."
    required: true
outputs:
  website-url:
    description: "URL of deployed site"
    # NOTE: WE DO NOT HAVE VALUES HERE.
    # HANDLED IN THE JS FILE

runs:
  using: "node16" # Tells gh that this is a JS Action
  main: "main.js" # File the gh action is going to use
```

### main.js

```js
const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

function run() {
  core.notice("Hello from custom JavaScript Action");
  // Get input vals
  const bucket = core.getInput("bucket", { required: true });
  const bucketRegion = core.getInput("bucket-region", { required: false });
  const distFolder = core.getInput("dist-folder", { required: true });

  // Upload to s3
  const s3uri = `s3://${bucket}`;
  exec.exec(`aws s3 sync ${distFolder} ${s3uri} --region ${bucketRegion}`);

  // Return URL
  const websiteUrl = `http://${bucket}.s3-website-${bucketRegion}.amazonaws.com`;
  core.setOutput("website-url", websiteUrl);
}

run();
```

### workflow

```yaml
jobs:
  lint: ...
  test: ...
  build: ...
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3 # REQUIRED for local JS Action
      - name: Get build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-files
          path: ./dist
      - name: Output contents
        run: ls
      - name: Deploy site
        id: deploy
        uses: ./.github/actions/deploy-s3-javascript
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          bucket: jk-gha-custom-hosting
          dist-folder: ./dist
      - name: Output Info
        run: |
          echo 'URL: ${{ steps.deploy.outputs.website-url }}'
```

> 💡 JS Custom action requires user to do `actions/checkout` if the action is a local custom action

## Docker Action

```yaml
name: "Deploy to AWS S3 Docker"
description: "Deploy static website to AWS S3 via docker"
inputs:
  bucket:
    description: "S3 bucket name"
    required: true
  bucket-region:
    description: "S3 bucket region"
    required: false
    default: "ap-southeast-1"
  dist-folder:
    description: "Folder containing deployable files."
    required: true
outputs:
  website-url:
    description: "URL of deployed site"

runs:
  using: "docker"
  image: "Dockerfile"
```

> 💡 gh generates ENV*VAR for the inputs with prefix `INPUT*\*`. [SEE BELOW]

```python
bucket = os.environ['INPUT_BUCKET']
bucket_region = os.environ['INPUT_BUCKET-REGION']
dist_folder = os.environ['INPUT_DIST-FOLDER']
```

> 💡 outputs are handled by using the print of the language. E.g. python print() [SEE BELOW]

```python
with open(os.environ['GITHUB_OUTPUT'], 'a') as gh_output:
        print(f'website-url={website_url}', file=gh_output)
```

# Security of gh actions

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/20.png" class="img-fluid rounded z-depth-1" %}

## Script Injections

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/21.png" class="img-fluid rounded z-depth-1" %}

- Be careful of assignment of variables in `run`
  - `issue_title="${{ github.event.issue.title }}”` can lead to script injection by passing in:
    `a”; echo $AWS_ACCESS_KEY_ID` - This results in - `issue_title="a"` - `echo $AWS_ACCESS_KEY_ID` - which will give the details
  - Solve this by using a ENV_VAR instead

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/22.png" class="img-fluid rounded z-depth-1" %}

## Actions

{% include figure.liquid loading="eager" path="assets/img/2025-01-13-github-actions/23.png" class="img-fluid rounded z-depth-1" %}

## Permission

```yaml
name: Label Issues (Permissions Example)
on:
  issues:
    types:
      - opened
jobs:
  assign-label:
    permissions: # RESTRICT PERMISSION. DEFAULT: FULL ACCESS ON EVERYTHING.
      issues: write
    runs-on: ubuntu-latest
    steps:
      - name: Assign label
        if: contains(github.event.issue.title, 'bug')
        run: |
          curl -X POST \
          --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
          -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
          -H 'content-type: application/json' \
          -d '{
              "labels": ["bug"]
            }' \
          --fail
```

### secrets.GITHUB_TOKEN

Token generated by github for the github API

- Gets revoked by the end of the job
- Permissions set in the yml will be the permission assigned to the GITHUB_TOKEN.

## Managing more permissions

Repository → Setting → Action → General

## Managing Secret Keys for 3rd-party platforms

```yaml
- name: Deploy site
  id: deploy
  uses: ./.github/actions/deploy-s3-javascript
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

- Information like `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are saved in the github action secrets
  - But still vulnerable to script injections
- OpenID Connect can help to make it more secure
  - Dynamically gets credentials
  - Requires setting up AWS IAM Role for this
  - Uses `aws-actions/configure-aws-credentials`
  - Do not need the `env` anymore

```yaml
job:
  deploy:
    permissions:
      id-token: write # REQUIRED as default GITHUB_TOKEN is set to None for this
      contents: read
    ...
    steps:
      # Do something above
      - name: Get AWS Permissions
        uses: aws-actions/configure-aws-credentials@v1
        with:
          role-to-assume: arn:aws:iam::...
          aws-region: ...
      ...
```
