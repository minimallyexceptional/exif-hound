package main

import (
	"log"
	"net/http"
	"os"
)

const (
	defaultPort string = "3000"
	defaultPath string = "../client/dist"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	path := os.Getenv("DIR_PATH")
	if path == "" {
		path = defaultPath
	}

	fs := http.FileServer(http.Dir(path))
	http.Handle("/", fs)

	log.Println("Listening on :" + port + "...")
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
