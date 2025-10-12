[
  {
    $match: {
      product_id: 1,
      account_id: 8000000000,
      $and: [
        {
          agent_skill_metrics_modified_at: {
            // current week
            $gte: ISODate("2025-10-05T00:00:00Z"),
            $lt: ISODate("2025-10-12T00:00:00Z")
          }
        },
        {
          score_calculated_at: {
            // not is current week
            $lt: ISODate("2025-10-05T00:00:00Z")
          }
        }
      ],
      is_deleted: false
    }
  },
  {
    $lookup: {
      from: "global_skill_metrics",
      let: {
        product_id: "$product_id",
        account_id: "$account_id",
        skill_id: "$skill_id"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    "$product_id",
                    "$$product_id"
                  ]
                },
                {
                  $eq: [
                    "$account_id",
                    "$$account_id"
                  ]
                },
                {
                  $eq: ["$skill_id", "$$skill_id"]
                }
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            global_max_ticket_resolved:
              "$max_ticket_resolved",
            global_min_avg_resolution_time:
              "$min_avg_resolution_time"
          }
        }
      ],
      as: "global_metrics"
    }
  },
  {
    $unwind: {
      path: "$global_metrics",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $addFields: {
      global_max_ticket_resolved:
        "$global_metrics.global_max_ticket_resolved",
      global_min_avg_resolution_time:
        "$global_metrics.global_min_avg_resolution_time"
    }
  },
  {
    $addFields: {
      score: {
        $round: [
          {
            $divide: [
              {
                $add: [
                  {
                    $cond: {
                      if: {
                        $gt: [
                          "$global_max_ticket_resolved",
                          0
                        ]
                      },
                      then: {
                        $divide: [
                          "$total_ticket_resolved",
                          "$global_max_ticket_resolved"
                        ]
                      },
                      else: 0
                    }
                  },
                  {
                    $cond: {
                      if: {
                        $gt: [
                          "$avg_resolution_time",
                          0
                        ]
                      },
                      then: {
                        $divide: [
                          "$global_min_avg_resolution_time",
                          "$avg_resolution_time"
                        ]
                      },
                      else: 0
                    }
                  }
                ]
              },
              2
            ]
          },
          2
        ]
      }
    }
  },
  {
    $addFields: {
      system_suggested_proficiency: {
        $switch: {
          branches: [
            {
              case: {
                $and: [
                  { $gte: ["$score", 0.7] },
                  { $lte: ["$score", 1.0] }
                ]
              },
              then: 3
            },
            {
              case: {
                $and: [
                  { $gte: ["$score", 0.3] },
                  { $lte: ["$score", 0.7] }
                ]
              },
              then: 2
            },
            {
              case: {
                $and: [
                  { $gte: ["$score", 0.0] },
                  { $lte: ["$score", 0.3] }
                ]
              },
              then: 1
            }
          ],
          default: 1
        }
      }
    }
  },
  {
    $project: {
      account_id: 1,
      product_id: 1,
      skill_id: 1,
      agent_id: 1,
      score: 1,
      system_suggested_proficiency: 1,
      _id: 0
    }
  },
  {
    $addFields: {
      enabled: true,
      proficiency:
        "$system_suggested_proficiency",
      proficiency_updated_at: "$$NOW",
      proficiency_updated_manually: false,
      associated_by_system: true,
      is_deleted: false,
      last_used_in_task_at: null,
      updated_by: null,
      updated_at: "$$NOW",
      created_at: "$$NOW",
      last_modified_at: "$$NOW",
      score_calculated_at: "$$NOW"
    }
  },
  {
    $merge: {
      into: "agent_skills",
      on: [
        "agent_id",
        "skill_id",
        "account_id",
        "product_id"
      ],
      whenMatched: [
        {
          $set: {
            score: "$$new.score",
            system_suggested_proficiency:
              "$$new.system_suggested_proficiency",
            updated_at: "$$new.updated_at",
            score_calculated_at:
              "$$new.score_calculated_at",
            proficiency: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$enabled", true] },
                    {
                      $or: [
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                true
                              ]
                            },
                            {
                              $or: [
                                {
                                  $lt: [
                                    "$proficiency_updated_at",
                                    {
                                      $dateSubtract:
                                        {
                                          startDate:
                                            "$$NOW",
                                          unit: "day",
                                          amount: 180
                                        }
                                    }
                                  ]
                                },
                                {
                                  $gt: [
                                    "$$new.system_suggested_proficiency",
                                    "$proficiency"
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                false
                              ]
                            },
                            {
                              $ne: [
                                "$$new.system_suggested_proficiency",
                                "$proficiency"
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                then: "$$new.proficiency",
                else: "$proficiency"
              }
            },
            proficiency_updated_at: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$enabled", true] },
                    {
                      $or: [
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                true
                              ]
                            },
                            {
                              $or: [
                                {
                                  $lt: [
                                    "$proficiency_updated_at",
                                    {
                                      $dateSubtract:
                                        {
                                          startDate:
                                            "$$NOW",
                                          unit: "day",
                                          amount: 180
                                        }
                                    }
                                  ]
                                },
                                {
                                  $gt: [
                                    "$$new.system_suggested_proficiency",
                                    "$proficiency"
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                false
                              ]
                            },
                            {
                              $ne: [
                                "$$new.system_suggested_proficiency",
                                "$proficiency"
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                then: "$$NOW",
                else: "$proficiency_updated_at"
              }
            },
            proficiency_updated_manually: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$enabled", true] },
                    {
                      $or: [
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                true
                              ]
                            },
                            {
                              $or: [
                                {
                                  $lt: [
                                    "$proficiency_updated_at",
                                    {
                                      $dateSubtract:
                                        {
                                          startDate:
                                            "$$NOW",
                                          unit: "day",
                                          amount: 180
                                        }
                                    }
                                  ]
                                },
                                {
                                  $gt: [
                                    "$$new.system_suggested_proficiency",
                                    "$proficiency"
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          $and: [
                            {
                              $eq: [
                                "$proficiency_updated_manually",
                                false
                              ]
                            },
                            {
                              $ne: [
                                "$$new.system_suggested_proficiency",
                                "$proficiency"
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                then: false,
                else: "$proficiency_updated_manually"
              }
            }
          }
        }
      ],
      whenNotMatched: "insert"
    }
  }
]
