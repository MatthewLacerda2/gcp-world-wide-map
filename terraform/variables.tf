variable "billing_account" {
  description = "The ID of the billing account to associate this project with (format: XXXXXX-XXXXXX-XXXXXX)"
  type        = string
}

variable "project_name" {
  description = "The human-readable name for the GCP project"
  type        = string
  default     = "world-wide-map-project"
}

variable "project_id" {
  description = "The unique GCP project ID (must be globally unique)"
  type        = string
}

variable "region" {
  description = "The default GCP region"
  type        = string
  default     = "us-central1"
}

variable "traceroute_regions" {
  description = "List of regions to deploy traceroute VMs"
  type        = list(string)
  default = [
    "us-central1",
    "us-east4",
    "us-west1",
    "europe-west1",
    "europe-central2",
    "asia-east1",
    "asia-southeast1",
    "southamerica-east1",
    "africa-south1",
    "australia-southeast1"
  ]
}
