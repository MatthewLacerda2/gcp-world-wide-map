variable "project_id" {
  description = "The GCP project ID"
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
  default     = ["us-central1", "europe-west1", "asia-east1"]
}
