package com.miaohaha.habit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;

@Slf4j
@Component
public class HabitPlugin extends BasePlugin {

    @Override
    public void start() {
        log.info("自律打卡插件已启动");
    }

    @Override
    public void stop() {
        log.info("自律打卡插件已停止");
    }
}