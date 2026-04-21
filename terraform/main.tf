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

# 3. Artifact Registry (Stores Docker images before they hit Cloud Run)
resource "google_artifact_registry_repository" "docker_repo" {
  project       = google_project.map_project.project_id
  location      = var.region
  repository_id = "map-repo"
  description   = "Docker repository for the Map Backend"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_apis]
}

# 4. PostgreSQL DB (Cloud SQL)
resource "google_sql_database_instance" "main" {
  project          = google_project.map_project.project_id
  name             = "world-wide-map-db"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    backup_configuration {
      enabled = false
    }
    ip_configuration {
      ipv4_enabled = true # Access from traceroute VMs
    }
  }

  deletion_protection = false # Set to true for production!

  depends_on = [google_project_service.enabled_apis]
}

# 5. Cloud Run Service (The NestJS API)
resource "google_cloud_run_v2_service" "backend" {
  project  = google_project.map_project.project_id
  name     = "world-wide-map-backend"
  location = var.region

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 2 # Prevent runaway costs
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/map-repo/backend:latest"
      
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "DB_HOST"
        value = "placeholder"
      }
    }
  }

  depends_on = [google_project_service.enabled_apis, google_artifact_registry_repository.docker_repo]
}

# 6. Global Traceroute VMs
resource "google_compute_instance" "traceroute_vms" {
  for_each     = toset(var.traceroute_regions)
  project      = google_project.map_project.project_id
  name         = "traceroute-${each.key}"
  machine_type = "f1-micro"
  zone         = "${each.key}-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata_startup_script = "python3 /path/to/traceroute_vm.py --region ${each.key}"

  depends_on = [google_project_service.enabled_apis]
}
