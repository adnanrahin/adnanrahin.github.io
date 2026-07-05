---
title: Deploying Spring Boot and Angular with AWS Network Load Balancer (NLB)
date: 2025-05-25
description: Full-stack Movie Application on EC2 with NLB, Auto Scaling Group, and CloudFormation — no EKS or ECS.
tags: [aws, nlb, cloudformation, ec2, docker, spring-boot, angular]
original_url: https://pantheonmle.medium.com/deploying-a-spring-boot-and-angular-application-with-aws-network-load-balancer-nlb-7de3e65c7490
---

> Originally published on [Medium](https://pantheonmle.medium.com/deploying-a-spring-boot-and-angular-application-with-aws-network-load-balancer-nlb-7de3e65c7490) · May 25, 2025

In today's cloud-native world, deploying highly available and scalable applications is crucial. This post walks through deploying a **Spring Boot backend** and **Angular frontend** using **AWS Network Load Balancer (NLB)** with an **Auto Scaling Group** — directly on EC2, without EKS or ECS.

## The Movie Application

The app is built with **Java**, **Spring Boot**, **Angular**, and **MySQL**:

- **Backend** — Spring Boot REST APIs serving movie data from MySQL
- **Frontend** — Angular UI consuming those APIs

**Goal:** Deploy the full stack using **NLB + EC2 + Docker Compose**, learning the infrastructure by building it — not relying on managed container services.

**Repository:** [Movie-Application](https://github.com/adnanrahin/Movie-Application) · branch `integrate_nlb`

## Architecture overview

<div class="mermaid">
flowchart TB
    Users([Users]) --> NLB[Network Load Balancer]
    NLB --> ASG[Auto Scaling Group]
    ASG --> EC2A[EC2 Instance]
    ASG --> EC2B[EC2 Instance]
    EC2A --> Spring[Spring Boot :8080]
    EC2A --> Angular[Angular / Nginx :80]
    EC2A --> MySQL[(MySQL)]
    EC2B --> Spring2[Spring Boot :8080]
    EC2B --> Angular2[Angular / Nginx :80]
    EC2B --> MySQL2[(MySQL)]
</div>

Each EC2 instance runs three Docker containers via `docker-compose`:

| Container | Port | Role |
|-----------|------|------|
| Spring Boot backend | 8080 | REST API |
| Angular (Nginx) | 80 | Frontend |
| MySQL | 3306 | Database |

NLB listeners forward TCP traffic on ports **80, 8080, 4200, 3605, 3606** to matching target groups.

## Why this architecture?

| Benefit | How |
|---------|-----|
| **Multi-port support** | Serve HTTP (80), API (8080), and custom services without port conflicts |
| **Elastic scalability** | ASG scales up during peak traffic, down during low usage |
| **High availability** | Instances spread across **3 Availability Zones** |
| **Low latency** | NLB is TCP-based, high throughput, routes only to healthy targets |

## Before you begin

Confirm your IAM user/role has access to:

- EC2 (instances, security groups, key pairs)
- VPC (networking)
- Auto Scaling Groups
- Elastic Load Balancing (NLB)
- CloudFormation

**Key pair:** Ensure an EC2 key pair named `aws-ec2-servers` exists for SSH access.

## Deployment steps

### 1. Clone the application

```bash
git clone https://github.com/adnanrahin/Movie-Application.git
cd Movie-Application
git checkout integrate_nlb
```

### 2. Launch the CloudFormation stack

```bash
cd cloudformation-stack
./start-stack.sh
```

### 3. Wait for UserData to complete

After the stack is up, allow **5–10 minutes** for the EC2 instance to:

1. Run the UserData shell script
2. Clone the repo and build with Maven
3. Start all three Docker containers

Setup logs are written to `/var/log/setup.log`.

### 4. Access the application

Use the **NLB DNS name** from the CloudFormation outputs. The app should be reachable on the configured listener ports.

## UserData script breakdown

The Launch Template UserData automates instance setup:

| Step | Action |
|------|--------|
| System update | `yum update -y` |
| Install Git & Docker | Package manager install |
| Install Docker Compose | Latest release from GitHub |
| Install JDK 11 | OpenLogic OpenJDK tarball |
| Install Maven 3.6.3 | Apache Maven binary |
| Configure Docker | Start service, enable on boot, add `ec2-user` to docker group |
| Clone & build | Clone repo, checkout `integrate_nlb`, `mvn clean install -DskipTests` |
| Run app | `docker-compose up -d` |

## CloudFormation stack components

### 1. VPC

Isolated network for all resources.

```yaml
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsSupport: true
    EnableDnsHostnames: true
```

### 2. Subnets (public & private)

| Type | CIDR examples | Purpose |
|------|---------------|---------|
| Public | `10.0.0.0/20`, `10.0.16.0/20`, `10.0.32.0/20` | NLB, NAT Gateway |
| Private | `10.0.128.0/20`, `10.0.144.0/20`, `10.0.160.0/20` | Internal resources |

Three subnets across three AZs for HA.

### 3. Internet Gateway & NAT Gateway

- **IGW** — public subnet internet access
- **NAT Gateway** (with Elastic IPs) — private subnets reach the internet for updates

### 4. Route tables

- **Public:** `0.0.0.0/0 → Internet Gateway`
- **Private:** `0.0.0.0/0 → NAT Gateway`

### 5. Security groups

**EC2 security group** — inbound:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP / Angular |
| 8080 | TCP | Spring Boot API |
| 4200 | TCP | Angular dev server |
| 3605, 3606 | TCP | Custom services |

**NLB security group** — mirrors the same public-facing ports.

### 6. Launch Template

| Setting | Value |
|---------|-------|
| AMI | Amazon Linux 2 |
| Instance type | `t2.medium` |
| Root volume | 30 GB gp3 |
| Data volume | 100 GB gp3 (retained on termination) |
| UserData | Full setup script (Docker, JDK, Maven, app deploy) |

### 7. Auto Scaling Group

```yaml
AutoScalingGroup:
  Properties:
    MinSize: 2
    MaxSize: 6
    DesiredCapacity: 3
    VPCZoneIdentifier: [PublicSubnet1, PublicSubnet2, PublicSubnet3]
    TargetGroupARNs: [Ec2TG80, Ec2TG8080, Ec2TG4200, ...]
```

### 8. Network Load Balancer

```yaml
NetworkLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Type: network
    Scheme: internet-facing
    Subnets: [PublicSubnet1, PublicSubnet2, PublicSubnet3]
```

NLB listeners forward TCP traffic to target groups — one listener per port.

### 9. Scaling policies

| Policy | Adjustment |
|--------|------------|
| Scale up | +1 instance when load increases |
| Scale down | −1 instance when load decreases |

## Key takeaways

- **NLB vs ALB:** NLB operates at Layer 4 (TCP). Use it when you need multi-port, low-latency forwarding without HTTP-level routing.
- **EC2 + Docker Compose** is a valid learning path before moving to ECS/EKS — you own every layer.
- **CloudFormation** makes the entire stack repeatable: VPC, subnets, NLB, ASG, and instance bootstrap in one deploy.
- **UserData** is the glue — automate everything so new ASG instances are ready without manual SSH.

## Resources

- [Movie-Application on GitHub](https://github.com/adnanrahin/Movie-Application)
- [Original Medium article](https://pantheonmle.medium.com/deploying-a-spring-boot-and-angular-application-with-aws-network-load-balancer-nlb-7de3e65c7490)
- [AWS NLB documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
