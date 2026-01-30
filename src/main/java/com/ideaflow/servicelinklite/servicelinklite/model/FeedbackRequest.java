package com.ideaflow.servicelinklite.servicelinklite.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotBlank(message = "message must not be blank")
    private String message;

    private String contact;

    private String pageUrl;

    private String userAgent;
}

