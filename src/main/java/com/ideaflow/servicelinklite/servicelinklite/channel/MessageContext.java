package com.ideaflow.servicelinklite.servicelinklite.channel;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class MessageContext {
    String message;
    String contact;
    String pageUrl;
    String userAgent;
}

