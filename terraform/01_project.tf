# 1. Project Creation
resource "google_project" "map_project" {
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
}

# 2. Enable Required APIs
locals {
  services = [
    "compute.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each                   = toset(local.services)
  project                    = google_project.map_project.project_id
  service                    = each.key
  disable_dependent_services = true
  disable_on_destroy         = false
}
