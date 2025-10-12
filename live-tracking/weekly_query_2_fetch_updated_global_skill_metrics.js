[
  {
    // find global metrics which were updated in the current week
    // within an account
    $match: {
      product_id: 1,
      account_id: 8000000000,
      updated_at: {
        $gte: ISODate("2025-11-01T00:00:00Z"),
        $lt: ISODate("2025-11-07T00:00:00Z")
      }
    }
  },
  {
    $project: {
      _id: 0,
      product_id: 1,
      account_id: 1,
      skill_id: 1,
      min_avg_resolution_time: 1,
      max_ticket_resolved: 1
    }
  }
]
