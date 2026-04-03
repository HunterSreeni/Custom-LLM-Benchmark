package com.techmart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TechMartApplication {

    public static void main(String[] args) {
        SpringApplication.run(TechMartApplication.class, args);
    }
}
