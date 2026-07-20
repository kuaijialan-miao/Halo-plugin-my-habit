package com.miaohaha.habit.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;
import java.time.Instant;

@Data
@EqualsAndHashCode(callSuper = true)
@GVK(group = "habit-tracker.miaohaha.com",
     version = "v1alpha1",
     kind = "Habit",
     plural = "habits",
     singular = "habit")
public class Habit extends AbstractExtension {

    private HabitSpec spec;

    @Data
    public static class HabitSpec {
        private String name;
        private String icon;
        private String color;
        private Integer targetDays;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
