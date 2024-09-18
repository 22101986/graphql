package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

const MaxClients = 10

type Message struct {
	Time    string
	Sender  string
	Content string
}

var (
	clients      = make(map[net.Conn]string)
	messages     []Message
	mu           sync.Mutex
	clientCount  = 0
	joinLeaveMsg = make(chan string)
	newMessage   = make(chan Message)
)

func main() {
	port := "9000"
	if len(os.Args) == 2 {
		port = os.Args[1]
    } else if len(os.Args) > 2 {
		fmt.Println("[USAGE]: ./TCPChat $port")
		return
	}

	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Error listening on port %s: %v", port, err)
	}
	defer listener.Close()

	log.Printf("Listening on port :%s", port)

	go broadcastMessages()

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		if clientCount >= MaxClients {
			conn.Write([]byte("Chat is full. Try again later.\n"))
			conn.Close()
			continue
		}

		go handleConnection(conn)
  }
}


func handleConnection(conn net.Conn) {
	defer conn.Close()

	clientCount++
	defer func() { clientCount-- }()

	conn.Write([]byte("Welcome to TCP-Chat!\n"))
	conn.Write([]byte(logo)) 

	conn.Write([]byte("[ENTER YOUR NAME]: "))
	reader := bufio.NewReader(conn)
	name, err := reader.ReadString('\n')
	if err != nil || strings.TrimSpace(name) == "" {
		conn.Write([]byte("Invalid name"))
		return		
	}
	name = strings.TrimSpace(name)

	mu.Lock()
	clients[conn] = name

	
	conn.Write([]byte("----- Chat History -----\n"))
	for _, msg := range messages {
		conn.Write([]byte(fmt.Sprintf("[\033[34m%s\033[0m][\033[32m%s\033[0m]: \033[33m%s\033[0m\n", msg.Time, msg.Sender, msg.Content)))
	}
	conn.Write([]byte("------------------------\n"))

	mu.Unlock()

	joinLeaveMsg <- fmt.Sprintf("\033[32m%s\033[0m has joined the chat...\n", name)

	for {
		msg, err := reader.ReadString('\n')
		if err != nil {
			joinLeaveMsg <- fmt.Sprintf("\033[31m%s\033[0m has left the chat...\n", name)
			mu.Lock()
			delete(clients, conn)
			mu.Unlock()
			return
		}

		// msg = strings.TrimSpace(msg)
		// if msg == "" {
		// 	continue
		// }

		currentTime := time.Now().Format("2006-01-02 15:04:05")
		newMessage <- Message{
			Time:    currentTime,
			Sender:  name,
			Content: msg,
		}
	}
}


func broadcastMessages() {
	for {
		select {
		case msg := <-newMessage:
			mu.Lock()
			messages = append(messages, msg)
			for conn := range clients {
				conn.Write([]byte(fmt.Sprintf("[\033[34m%s\033[0m][\033[32m%s\033[0m]: \033[33m%s\033[0m\n", msg.Time, msg.Sender, msg.Content)))
			}
			mu.Unlock()
		case info := <-joinLeaveMsg:
			mu.Lock()
			for conn := range clients {
				conn.Write([]byte(info))
			}
			mu.Unlock()
		}
	}
}

const logo = `
         _nnnn_
        dGGGGMMb
       @p~qp~~qMb
       M|@||@) M|
       @,----.JM|
      JS^\__/  qKL
     dZP        qKRb
    dZP          qKKb
   fZP            SMMb
   HZM            MMMM
   FqM            MMMM
 __| ".        |\dS"qML
 |     .       |  ' \Zq
_)      \.___.,|     .'
\____   )MMMMMP|   .'
      -'        --'
`
