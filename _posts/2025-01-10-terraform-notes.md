---
layout: post
title: Terraform Tutorial
date: 2025-01-10 00:00:00
description: Notes on Terraform
tags: data_engineering infra terraform
categories: learning

toc:
  beginning: true
---

# Setup

## Windows

1. https://www.terraform.io/downloads
2. Set Env Path
   1. System Variables → Path
      {% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/1.png" class="img-fluid rounded z-depth-1" %}
3. Add path to environment

## Mac via Homebrew

1. https://brew.sh/
2. Copy command
3. Paste command in Terminal to install Homebrew
4. Install terraform

```bash
brew install terraform
```

## Test Terraform using cmd/terminal

```bash
terraform -v
```

## Mac via binary download

1. https://www.terraform.io/downloads
2. Unzip file
3. echo $PATH to see list of locations
4. move terraform binary to one of the locations
   1. Generally use `usr/local/bin`

# Tutorial

Terraform is declarative in nature and therefore we are configuring what we want to see in the cloud instead of how much we want to add/remove from the cloud.

## Cloud Provider

1. Select Cloud to configure (AWS)
2. https://registry.terraform.io/providers/hashicorp/aws/latest/docs

## Configure the Provider and Region

1. Create a `.tf` file. E.g. `main.tf`

```terraform
# Configure the AWS Provider
provider "aws" {
  region = "ap-southeast-1"
}
```

## Setup Authentication

### 1. Get Access and Secret Key from Cloud Provider

1. AWS
2. Profile Name
3. Security Credentials
4. Access Key Tab
   {% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/2.png" class="img-fluid rounded z-depth-1" %}
5. Create New Access Key
6. Show Access Key
   1. This will provide the value for `access_key` and `secret_key`
7. Download Key File as `secret_key` will not be able to be found anymore after you close the tab

```terraform
# Configure the AWS Provider
provider "aws" {
  region = "ap-southeast-1"
  access_key = "my-access-key"
  secret_key = "my-secret-key"
}
```

## Create Resources

E.g. Resources includes EC2, etc.

### Syntax for creating resources

```terraform
resource "<provider>_<resource_type>" "<name>" {
  # config options in key value pairs
  key = "value"
  key2 = "value2"
}
```

### Creating EC2 Instance

https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance

1. Obtain AMI from AWS to be used in the code
   {% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/3.png" class="img-fluid rounded z-depth-1" %}

```terraform
# Configure the AWS Provider
provider "aws" {
  region = "ap-southeast-1"
  access_key = "my-access-key"
  secret_key = "my-secret-key"
}

resource "aws_instance" "my-first-server" {
  ami           = "ami-055d15d9cfddf7bd3"
  instance_type = "t2.micro"

  tags = {
    Name = "ubuntu"
  }
}
```

## Terraform Init

Looks at the config in `.tf` files and look for all the providers defined and will download all the plugins required.

1. Navigate terminal to where the `.tf` file is

```bash
terraform init
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/4.png" class="img-fluid rounded z-depth-1" %}

## Terraform Plan

Does a dry run of the code and show you all the changes that is going to be applied Delete/Create/Modify any instances.

```bash
terraform plan
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/5.png" class="img-fluid rounded z-depth-1" %}

## Terraform Apply

Run the code to production.

```bash
terraform apply
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/6.png" class="img-fluid rounded z-depth-1" %}
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/7.png" class="img-fluid rounded z-depth-1" %}

## Terraform Destroy

Delete the whole architecture. Usually will not do this and will instead make changes within the file and use `terraform apply` to add/remove instances from the architecture.

```bash
terraform destroy
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/8.png" class="img-fluid rounded z-depth-1" %}
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/9.png" class="img-fluid rounded z-depth-1" %}

### Destroying specific resource

1. See the resources that are tracked by terraform `terraform state list`
2. Remove the states that you DO NOT want to destroy`terraform state rm <resource1> <resource2> <resource3> ...`
3. `terraform destroy` to destroy the rest of the available states

## Referencing Resources

You can reference other resources by pointing to the `<provider>_<resource_type>.<name>.id`

```terraform
resource "aws_vpc" "first-vpc" {
  cidr_block       = "10.0.0.0/16"

  tags = {
    Name = "production"
  }

}

resource "aws_subnet" "subnet-1" {
 # this is taking from the resource name above. Every resource has id property to access
  vpc_id     = aws_vpc.first-vpc.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "prod-subnet"
  }
}
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/10.png" class="img-fluid rounded z-depth-1" %}

## Terraform Files

`terraform init` creates a `.terraform` folder in the directory that contains the configs for the resources.

`terraform.tfstate` contains the state of terraform so that when we make any modifications/etc., it will be able to check the current status and compare against the code.

## Terraform State List

This shows all the resources that was created along with the resource name

```bash
terraform state list
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/11.png" class="img-fluid rounded z-depth-1" %}

## Terraform State Show

This shows the detailed output regarding the state which would normally be stored in the console.

```bash
# terraform state show <resource>.<resource_name>
terraform state show aws_eip.one
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/12.png" class="img-fluid rounded z-depth-1" %}

## Terraform Output

This will print out the details and prints out in the console after `terraform refresh`. You can only have 1 value per output.

```terraform
# output "<output_key_name>" {
#   value = <resource_type>.<resource_name>.<property>
# }

output "server_public_ip" {
  value = aws_eip.one.public_ip
}
```

{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/13.png" class="img-fluid rounded z-depth-1" %}

> 💡 Be careful when you want to add new outputs and see the outputs. Not a good idea to use terraform apply as that might make changes on production side.

## Target Resources

This will only `apply/destroy` changes to a specific resource instead of potentially changing everything in production (e.g. route table, subnet)

```bash
# terraform destroy -target <resource>.<resource_name>
# terraform apply -target <resource>.<resource_name>

terraform apply -target aws_eip.one
```

## Variables

This will allow terraform file to reference a variable. Generally passed at runtime.

```terraform
variable "variable_name" {
  description = ""
  default = "abcd"
  type = String
}

# To access the variable
var.variable_name
```

### Method 1: Input value at Terraform Apply user prompt

If a value is not defined in the variable, at `terraform apply/destroy`, user will be prompted to submit a value
{% include figure.liquid loading="eager" path="assets/img/2025-01-10-terraform-notes/14.png" class="img-fluid rounded z-depth-1" %}

### Method 2: Input value as part of command

Alternatively, we can use `-var` to specify the value of the variable during `terraform apply`

```bash
terraform apply -var "variable_name=abcd"
```

### Method 3: Input value at .tfvars file

We can create a `.tfvars` file to store the values of the variables. E.g. `example.tfvars`

```bash
variable_name = "abcd"
```

Run the `main.tf` file referencing the file via `-var-file`

```bash
terraform apply -var-file example.tfvars
```
