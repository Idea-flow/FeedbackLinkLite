package com.ideaflow.feedbacklinklite.channel;

public interface MessageChannel {
    ChannelResult send(MessageContext context);

    String name();
}

