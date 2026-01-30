package com.ideaflow.servicelinklite.servicelinklite.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {
    private FeedbackStatus status;
    private String message;

    public static FeedbackResponse of(FeedbackStatus status) {
        return new FeedbackResponse(status, null);
    }

    public static FeedbackResponse of(FeedbackStatus status, String message) {
        return new FeedbackResponse(status, message);
    }
}

