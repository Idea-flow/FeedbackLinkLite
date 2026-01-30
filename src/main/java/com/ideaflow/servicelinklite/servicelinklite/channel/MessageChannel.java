package com.ideaflow.servicelinklite.servicelinklite.channel;

public interface MessageChannel {
    ChannelResult send(MessageContext context);

    String name();
}

