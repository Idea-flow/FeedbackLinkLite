package com.ideaflow.servicelinklite.servicelinklite.channel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResult {
    private boolean success;
    private String message;

    public static ChannelResult ok() {
        return new ChannelResult(true, null);
    }

    public static ChannelResult fail(String message) {
        return new ChannelResult(false, message);
    }
}

