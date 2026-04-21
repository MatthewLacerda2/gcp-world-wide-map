resource "google_artifact_registry_repository" "docker_repo" {
  project       = google_project.map_project.project_id
  location      = var.region
  repository_id = "map-repo"
  description   = "Docker repository for the Map Backend"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_apis]
}

# NEW: Automatically build the Docker image before deploying
resource "terraform_data" "build_image" {
  input = var.project_id

  provisioner "local-exec" {
    command = "gcloud builds submit --project ${var.project_id} --tag ${var.region}-docker.pkg.dev/${var.project_id}/map-repo/backend:latest ../cloud_run"
  }

  depends_on = [google_artifact_registry_repository.docker_repo]
}

resource "google_cloud_run_v2_service" "backend" {
  project  = google_project.map_project.project_id
  name     = "world-wide-map-backend"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 2
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
        value = "/cloudsql/${google_sql_database_instance.main.connection_name}"
      }
      env {
        name  = "DB_USER"
        value = "postgres"
      }
      env {
        name  = "DB_PASS"
        value = "Password123!"
      }
      env {
        name  = "DB_NAME"
        value = "mydb"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.enabled_apis, 
    google_artifact_registry_repository.docker_repo, 
    google_sql_database_instance.main,
    terraform_data.build_image
  ]
}

# Allow public access to the Cloud Run service
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_project.map_project.project_id
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
