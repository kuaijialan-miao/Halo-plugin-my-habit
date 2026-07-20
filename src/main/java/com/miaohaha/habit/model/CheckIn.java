package com.miaohaha.habit.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;
import java.time.Instant;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@GVK(group = "habit-tracker.miaohaha.com",
     version = "v1alpha1",
     kind = "CheckIn",
     plural = "checkins",
     singular = "checkin")
public class CheckIn extends AbstractExtension {

    private CheckInSpec spec;

    @Data
    public static class CheckInSpec {
        private String habitName;
        private LocalDate checkDate;
        private String note;
        private Instant createdAt;
    }
}
