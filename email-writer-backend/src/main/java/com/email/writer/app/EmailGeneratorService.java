package com.email.writer.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {


    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String generateEmailReply(EmailRequest emailRequest){
        //buld the prompt
        String prompt=buildPrompt(emailRequest);

        //craft the request
        Map<String,Object> requestBody= Map.of(
                "contents",new Object[] {
                        Map.of(
                                "parts",new Object[] {
                                        Map.of("text",prompt)
                                }
                        )
                }
        );

        //do request and get response
        String response=webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .header("Content-Type","application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        //Extract Response and return
        return extractReponseContent(response);
    }

    private String extractReponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(response);
            return node.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

        } catch (Exception e) {
            return "Error processing request " + e.getMessage();
        }
    }

    //building the string that is to be submite to the AI
    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        //asking the ai
        prompt.append("Generate a professional email reply for the following email content. Please don't generate a subject line ");
        //setting the tone
        if(emailRequest.getTone() != null && !emailRequest.getTone().equals("") ){
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone.");
        }
        //attaching the original email
        prompt.append("\n Original email: \n").append(emailRequest.getEmailContent());
        //returning the entire prompt as String
        return prompt.toString();
    }
}
