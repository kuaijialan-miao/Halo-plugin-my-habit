package com.miaohaha.habit;

import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;

@Component
public class HabitPlugin extends BasePlugin {

    public HabitPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Override
    public void start() {
        log.info("自律打卡插件已启动");
    }

    @Override
    public void stop() {
        log.info("自律打卡插件已停止");
    }
}
