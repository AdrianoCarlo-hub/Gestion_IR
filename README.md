# Safidy

Application Web de Gestion et de Suivi de l'Impot sur le Revenu (IR)
au sein d'un Centre Fiscal a Madagascar.

## Objectif

- enregistrement des contribuables
- gestion des declarations d'IR
- calcul automatique de l'impot
- suivi des deficits reportables
- suivi des acomptes et des paiements
- calcul des penalites
- suivi des suspensions d'activite
- recherche et statistiques
- tracabilite (journal d'audit)

L'application est reservee aux agents de l'administration fiscale.
Il n'y a aucun espace contribuable dans cette premiere version.

## Stack technique

Backend  : Java 21, Spring Boot, Spring Web, Spring Data JPA,
           Spring Security, JWT, BCrypt, Bean Validation, PostgreSQL
Frontend : React, Vite, JavaScript, Axios, React Router
Base     : PostgreSQL
Outils   : Git, Git Bash, VS Code

## Architecture

React -> Spring Boot -> PostgreSQL (MVC simple, monolithique).

Pas de Clean Architecture, pas d'Hexagonal, pas de Microservices,
pas de CQRS, pas de DDD, pas de Flyway.

## Structure du projet

safidy/
  backend/    -> API REST Spring Boot
  frontend/   -> Application React
  database/   -> Scripts SQL
  README.md

## Auteur

Projet de fin d'etudes
