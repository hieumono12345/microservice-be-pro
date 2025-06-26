listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/server.crt"
  tls_key_file  = "/vault/certs/server.key"
}

storage "file" {
  path = "/vault/data"
}

disable_mlock = true
ui = true
