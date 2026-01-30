package com.ideaflow.servicelinklite.servicelinklite.service;

import com.ideaflow.servicelinklite.servicelinklite.channel.ChannelResult;
import com.ideaflow.servicelinklite.servicelinklite.channel.MessageChannel;
import com.ideaflow.servicelinklite.servicelinklite.channel.MessageContext;
import com.ideaflow.servicelinklite.servicelinklite.config.FeedbackProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelRouter {
    private final List<MessageChannel> channels;
    private final FeedbackProperties feedbackProperties;

    public ChannelResult route(MessageContext context) {
        if (!feedbackProperties.isEnabled()) {
            return ChannelResult.fail("Feedback disabled");
        }
        if (CollectionUtils.isEmpty(channels)) {
            return ChannelResult.fail("No channel configured");
        }
        // First version: sequential, stop on first failure
        for (MessageChannel channel : channels) {
            ChannelResult result = channel.send(context);
            if (!result.isSuccess()) {
                return result;
            }
        }
        return ChannelResult.ok();
    }
}

